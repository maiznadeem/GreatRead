const fs = require("fs");
const axios = require("axios");
const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, ExternalHyperlink, PageBreak, CharacterSet, ShadingType } = require("docx");
const { v4: uuidv4 } = require('uuid');
const stripe = require("../utils/stripe");
const { storage, PURCHASE_BUCKET } = require("../utils/storage");
const { toBookIds, isStringArray } = require("../utils/validate");
const Book = require("../models/Book");
const Category = require("../models/Category");
const Payment = require("../models/Payment");

const { convert } = require("./convertToPDF");

const CLAIM_TTL_MS = 10 * 60 * 1000;

const TIERS = {
    1: { name: "Any 10 books from 1 category", unitAmount: 2900, maxBooks: 10, minCategories: 1, maxCategories: 1 },
    2: { name: "Any 10 books from 1-3 categories", unitAmount: 4900, maxBooks: 10, minCategories: 1, maxCategories: 3 },
    3: { name: "Any 30 books from any category", unitAmount: 5900, maxBooks: 30, minCategories: 0, maxCategories: 100 },
};

const PREVIEW_KEYS = ['notes', 'links', 'label'];

// Returns the validated order, or null if the request body is invalid.
const parseOrder = ({ previewOptions, selectedButton, notesCategories, books }) => {
    const tier = Number.isInteger(selectedButton) ? TIERS[selectedButton] : undefined;
    if (!tier) return null;

    const bookIds = toBookIds(books, tier.maxBooks);
    if (!bookIds || !bookIds.length || new Set(bookIds).size !== bookIds.length) return null;

    if (!isStringArray(notesCategories, tier.maxCategories)
        || notesCategories.length < tier.minCategories
        || new Set(notesCategories).size !== notesCategories.length) return null;

    if (!previewOptions || typeof previewOptions !== 'object' || Array.isArray(previewOptions)
        || !PREVIEW_KEYS.every((key) => typeof previewOptions[key] === 'boolean')) return null;

    return {
        tier,
        selectedButton,
        bookIds,
        notesCategories,
        previewOptions: Object.fromEntries(PREVIEW_KEYS.map((key) => [key, previewOptions[key]])),
    };
};

// Creates the Payment and Stripe Checkout session only. Documents are generated after payment (see fulfillPayment).
const authorizePurchase = async (req, res) => {
    const order = parseOrder(req.body || {});
    if (!order) {
        return res.status(400).json({ error: "Invalid purchase request." });
    }

    try {
        // Tiers 1-2 are priced per category: the categories must exist and every book must belong to one.
        const restricted = order.tier.maxCategories < TIERS[3].maxCategories;
        const bookFilter = { _id: { $in: order.bookIds } };
        if (restricted) {
            const known = await Category.countDocuments({ name: { $in: order.notesCategories } });
            if (known !== order.notesCategories.length) {
                return res.status(400).json({ error: "Invalid purchase request." });
            }
            bookFilter.categories = { $in: order.notesCategories };
        }
        if (await Book.countDocuments(bookFilter) !== order.bookIds.length) {
            return res.status(400).json({ error: "Invalid purchase request." });
        }

        const payment = new Payment({
            amount: order.tier.unitAmount,
            previewOptions: order.previewOptions,
            selectedButton: order.selectedButton,
            categories: order.notesCategories,
            books: order.bookIds,
        });
        await payment.save();

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: order.tier.name,
                        },
                        unit_amount: order.tier.unitAmount
                    },
                    quantity: 1,
                }
            ],
            success_url: `${process.env.CLIENT_URL}/notes?id=${payment._id}`,
            cancel_url: `${process.env.CLIENT_URL}/notes?id=${payment._id}`,
        });

        payment.stripeId = session.id;
        payment.url = session.url;
        await payment.save();

        res.json({ url: session.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "There's an error on our side." });
    }
}

// Generates the documents for a paid payment. Returns the updated payment, or null if another
// request/webhook already holds the generation claim (or there is nothing to do).
const fulfillPayment = async (payment) => {
    const claimed = await Payment.findOneAndUpdate(
        {
            _id: payment._id,
            success: true,
            $and: [
                { $or: [{ urls: { $exists: false } }, { urls: { $size: 0 } }] },
                { $or: [{ generatingAt: null }, { generatingAt: { $lt: new Date(Date.now() - CLAIM_TTL_MS) } }] },
            ],
        },
        { $set: { generatingAt: new Date() } },
        { returnDocument: 'after' }
    );
    if (!claimed) return null;

    const urls = await getWordDocument({ previewOps: claimed.previewOptions, bookIds: claimed.books });

    return Payment.findOneAndUpdate(
        { _id: claimed._id },
        urls.length
            ? { $set: { urls, urlsGeneratedAt: new Date() }, $unset: { generatingAt: 1 } }
            : { $unset: { generatingAt: 1 } },
        { returnDocument: 'after' }
    );
};

const getWordDocument = async ({ previewOps, bookIds }) => {

    try {

        const previewOptions = previewOps;
        const books = await Book.find({ _id: { $in: bookIds } }).populate('notes');


        const logo = fs.readFileSync('./assets/Logo.png');
        const amazon = fs.readFileSync('./assets/amazon.png');
        const perlego = fs.readFileSync('./assets/perlego.png');
        const font = fs.readFileSync("./assets/Manrope/static/Manrope-SemiBold.ttf");

        const createTable = async (book) => { 

            const imageBuffer = await axios.get(book.image, { responseType: 'arraybuffer', timeout: 15000, maxContentLength: 10 * 1024 * 1024 })
                .then(response => Buffer.from(response.data, 'binary'))
                .catch(error => {
                    console.error("Error fetching image:", error);
                    return null;
                });

            if (!imageBuffer) {
                console.error("Failed to fetch image from URL:", book.image);
                return;
            }

            return new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                borders: 0,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: {
                                    size: 30,
                                    type: WidthType.PERCENTAGE,
                                },
                                rowSpan: 2,
                                columnSpan: 2,
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                type: "png",
                                                data: logo,
                                                transformation: {
                                                    width: 100,
                                                    height: 80,
                                                },
                                            }),
                                        ],
                                        alignment: AlignmentType.LEFT,
                                        spacing: {
                                            after: 600,
                                        },
                                    }),
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                type: "jpg",
                                                data: imageBuffer,
                                                transformation: {
                                                    width: 250,
                                                    height: 400,
                                                },
                                            }),
                                        ],
                                        alignment: AlignmentType.LEFT,
                                        spacing: {
                                            after: 400,
                                        },
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: {
                                    size: 70,
                                    type: WidthType.PERCENTAGE,
                                },
                                children: [
                                    new Paragraph({
                                        run: {
                                            font: "Manrope",
                                        },
                                        shading: {
                                            fill: "956829",
                                            val: ShadingType.SOLID,
                                        },
                                        children: [
                                            new TextRun({
                                                font: "Manrope",
                                                text: 'HIGHLIGHTS',
                                                bold: true,
                                                size: 32,
                                                color: "FFFFFF",
                                            }),
                                        ],
                                        alignment: AlignmentType.CENTER,
                                        spacing: {
                                            after: 200,
                                        },
                                    }),
                                ],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                rowSpan: 4,
                                width: {
                                    size: 70,
                                    type: WidthType.PERCENTAGE,
                                },
                                children:
                                    (book.notes?.content ? book.notes.content.map(point => new Paragraph({
                                        children: [
                                            new TextRun({
                                                font: "Manrope",
                                                text: point,
                                                size: 22,
                                            }),
                                        ],
                                        bullet: {
                                            level: 0,
                                        },
                                    })) : []),
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                columnSpan: 2,
                                children: book.categories[0] && previewOptions.label ? [
                                    new Paragraph({
                                        shading: {
                                            fill: "EA580C",
                                            val: ShadingType.SOLID,
                                        },
                                        children: [
                                            new TextRun({
                                                color: "FFFFFF",
                                                size: 28,
                                                font: "Manrope",
                                                text: book.categories[0],
                                            }),
                                        ],
                                        alignment: AlignmentType.CENTER,
                                        spacing: {
                                            before: 200,
                                        },
                                    }),
                                ] : [ new Paragraph("") ],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                columnSpan: 2,
                                children: book.categories[1] && previewOptions.label ? [
                                    new Paragraph({
                                        shading: {
                                            fill: "2563EB",
                                            val: ShadingType.SOLID,
                                        },
                                        children: [
                                            new TextRun({
                                                color: "FFFFFF",
                                                size: 28,
                                                font: "Manrope",
                                                text: book.categories[1],
                                            }),
                                        ],
                                        alignment: AlignmentType.CENTER,
                                        spacing: {
                                            before: 200,
                                            after: 400,
                                        },
                                    }),
                                ] : [ new Paragraph("") ],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                width: {
                                    size: 15,
                                    type: WidthType.PERCENTAGE,
                                },
                                children: [
                                    new Paragraph({
                                        children: [
                                            previewOptions.links && book?.amazon &&
                                            new ExternalHyperlink({
                                                children: [
                                                    new ImageRun({
                                                        type: "png",
                                                        data: amazon,
                                                        transformation: {
                                                            width: 100,
                                                            height: 30,
                                                        },
                                                    }),
                                                ],
                                                link: book.amazon,
                                            }),
                                        ],
                                        alignment: AlignmentType.CENTER,
                                        spacing: {
                                            after: 200,
                                        },
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: {
                                    size: 15,
                                    type: WidthType.PERCENTAGE,
                                },
                                children: [
                                    new Paragraph({
                                        children: [
                                            previewOptions.links && book?.perlego &&
                                            new ExternalHyperlink({
                                                children: [
                                                    new ImageRun({
                                                        type: "png",
                                                        data: perlego,
                                                        transformation: {
                                                            width: 100,
                                                            height: 30,
                                                        },
                                                    }),
                                                ],
                                                link: book?.perlego,
                                            }),
                                        ],
                                        alignment: AlignmentType.CENTER,
                                        spacing: {
                                            after: 200,
                                        },
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            })
        };

        const section = {
            properties: {
                page: {
                    margin: {
                        top: 500,
                        right: 500,
                        bottom: 500,
                        left: 500,
                    },
                },
            },
            children: (await Promise.all(books.map(async book => [
                await createTable(book),
                new Paragraph({
                    children: [
                        new TextRun("\n"),
                    ],
                    alignment: AlignmentType.LEFT,
                }),
                previewOptions.notes &&
                new Table({
                    borders: 0,
                    width: {
                        size: "100%",
                        type: WidthType.PERCENTAGE,
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: {
                                        size: "100%",
                                        type: WidthType.PERCENTAGE,
                                    },
                                    children: [
                                        new Paragraph({
                                            run: {
                                                font: "Manrope",
                                            },
                                            shading: {
                                                fill: "956829",
                                                val: ShadingType.SOLID,
                                            },
                                            children: [
                                                new TextRun({
                                                    font: "Manrope",
                                                    text: 'NOTES',
                                                    bold: true,
                                                    size: 32,
                                                    color: "FFFFFF",
                                                }),
                                            ],
                                            alignment: AlignmentType.CENTER,
                                            spacing: {
                                                after: 200,
                                            },
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        previewOptions.notes && 
                        new TextRun({
                            font: "Manrope",
                            text: "",
                            size: 22,
                        }),
                        new PageBreak(),
                    ],
                    alignment: AlignmentType.LEFT,
                }),
            ]))).flat(),
        };        

        const doc = new Document({
            sections: [],
            defaultFontName: "Manrope",
            fonts: [{ name: "Manrope", data: font, characterSet: CharacterSet.ANSI }],
        });

        doc.addSection(section);

        const filename = uuidv4();

        await Packer.toBuffer(doc).then((buffer) => {
            fs.writeFileSync(`./assets/${filename}.docx`, buffer);
        });


        let fileUrls = [];
        await convert(filename)
        fileUrls = await uploadDocs(filename);
        return fileUrls;

    } catch (error) {
        console.error('Error retrieving file:', error);
        return [];
    }

};


async function uploadDocs(filename) {
    try {
        const folderName = 'purchase';
        const objectNameDocx = `${folderName}/${filename}/${filename}.docx`;
        const objectNamePdf = `${folderName}/${filename}/${filename}.pdf`;

        const bucket = storage.bucket(PURCHASE_BUCKET);

        await Promise.all([
            new Promise((resolve, reject) => {
                const docxFile = bucket.file(objectNameDocx);
                const docxStream = docxFile.createWriteStream({
                    metadata: {
                        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    }
                });
                fs.createReadStream(`./assets/${filename}.docx`)
                    .pipe(docxStream)
                    .on('error', reject)
                    .on('finish', resolve);
            }),
            new Promise((resolve, reject) => {
                const pdfFile = bucket.file(objectNamePdf);
                const pdfStream = pdfFile.createWriteStream({
                    metadata: {
                        contentType: 'application/pdf'
                    }
                });
                fs.createReadStream(`./assets/${filename}.pdf`)
                    .pipe(pdfStream)
                    .on('error', reject)
                    .on('finish', resolve);
            })
        ]);

        fs.unlinkSync(`./assets/${filename}.docx`);
        fs.unlinkSync(`./assets/${filename}.pdf`);

        const docxSignedUrl = await bucket.file(objectNameDocx).getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000,
        });

        const pdfSignedUrl = await bucket.file(objectNamePdf).getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000,
        });

        return [...docxSignedUrl, ...pdfSignedUrl];
    } catch (error) {
        console.error('Error uploading files:', error);
        throw error;
    }
}



module.exports = {
    authorizePurchase,
    fulfillPayment,
};
