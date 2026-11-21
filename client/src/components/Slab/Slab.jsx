import { useState } from "react";
import { Button, CircularProgress } from '@mui/material';
import { purchaseBooksAPI } from "../../utils/api";
import { useNotes } from "../../context/NotesContext";
import pdf from "../../assets/links/PDF.png";
import word from "../../assets/links/Word.png";
import ConfirmationDialog from "./ConfirmationDialog";
import ExpirationDialog from "./ExpirationDialog"
import { scrollToElement } from "../../utils/scroll";

const Slab = () => {
    const { previewOptions, selectedButton, notesBooks, setNotesBooks, urls, setUrls, urlsLoading, setUrlsLoading, notesCategories } = useNotes();
    const [open, setOpen] = useState(false);
    const [expireOpen, setExpireOpen] = useState(false);
    const [purchaseError, setPurchaseError] = useState('');

    let total = 10;
    let categories = 1;

    if (selectedButton == 2) {
        categories = 3;
    }
    if (selectedButton == 3) {
        total = 30;
        categories = Infinity;
    }

    const handleClose = () => {
        setOpen(false);
    };
    const handleExpireClose = () => {
        setExpireOpen(false);
    };

    const handleClear = () => {
        setOpen(false);
        setUrls({
            address: [],
            timeCreated: null,
        });
        setNotesBooks([]);
    };

    const handleBelowClick = () => scrollToElement("notessection");

    const handlePurchase = async () => {
        if (urls && urls.address && urls?.address?.length != 0) {
            setOpen(true);
            return;
        }
        setUrlsLoading(true);
        setPurchaseError('');
        try {
            const response = await purchaseBooksAPI(previewOptions, notesBooks, selectedButton, notesCategories);
            if (!response?.url) {
                throw new Error("We couldn't start checkout. Please try again.");
            }
            window.location.href = response.url;
        } catch (error) {
            console.error('Error starting checkout:', error);
            setPurchaseError(
                error.status === 400 || error.status === 429
                    ? error.message
                    : "We couldn't start checkout. Please try again."
            );
            setUrlsLoading(false);
        }
    }

    const handleDownload = (num) => {
        // timeCreated is urlsGeneratedAt (falling back to createdAt); signed URLs last 1 hour.
        const expirationInterval = 60 * 60 * 1000;
        const generatedAt = new Date(urls?.timeCreated).getTime();
        const isExpired = Number.isNaN(generatedAt) || Date.now() - generatedAt > expirationInterval;

        if (urls.address && urls.address.length > 0 && !isExpired) {
            const downloadUrl = urls.address;
            const link = document.createElement('a');
            link.href = downloadUrl[num];
            link.target = '_blank';
            link.download = `Notes${num == 0 ? ".docx" : ".pdf"}`;
            link.click();
        }
        else {
            setUrls({
                address: [],
                timeCreated: null,
            });
            setNotesBooks([]);
            setExpireOpen(true);
        }
    };

    return (
        <div className="text-black my-20 flex flex-col custmd:flex-row justify-center items-center gap-10">
            <div className="w-full sm:w-96 bg-footer rounded-2xl shadow-xl flex justify-center items-center">
                {notesBooks.length ? (
                    <div className="grid grid-cols-2 gap-4 overflow-y-auto h-[500px] px-4 my-8 scrollbar-thin scrollbar-webkit">
                        {notesBooks.map((book) => (
                            <div key={book._id} className="w-32 h-48 rounded-lg overflow-hidden shadow-lg">
                                <img
                                    src={book.image}
                                    alt={book.title}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => {
                                        if (urls.address && urls.address.length == 0 && !urlsLoading)
                                            setNotesBooks(prevBooks => prevBooks.filter(filterbook => filterbook._id !== book._id));
                                    }}                                    
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-[500px] flex justify-center items-center">
                        <p>
                            Select books from <button className="manrope-semibold" onClick={handleBelowClick}>below</button>
                        </p>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-2 justify-center items-center sm:items-start text-center sm:text-left">
                <p>
                    {
                        urls.address && urls.address.length > 0 ? "Please download the notes in your desired format by clicking the button below."
                        :
                        `
                        Hi, you have ${total - notesBooks.length}${" "}
                        ${total - notesBooks.length == 1 ? "book" : "books"} left to
                        choose from${" "}
                        ${categories == Infinity ? "any" : `${categories}`}${" "}
                        ${categories == 1 || categories == Infinity
                            ? "category"
                            : "categories"}
                        `
                    }
                    
                </p>
                
                { urls.address && urls.address.length > 0 && 
                
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button className="w-48" variant="contained"
                            sx={{
                                color: "#000000",
                                backgroundColor: "#F2EADF",
                                "&:hover": {
                                    backgroundColor: "#F2EADF",
                                },
                                "&:disabled": {
                                    backgroundColor: "#CCCCCC",
                                },
                            }}
                            disableElevation
                            onClick={() => handleDownload(0)}
                        >
                            <img src={word} alt="icon" className="w-6 h-6 mr-2" />
                            Download Word
                        </Button>
                        <Button className="w-48" variant="contained"
                            sx={{
                                color: "#000000",
                                backgroundColor: "#F2EADF",
                                "&:hover": {
                                    backgroundColor: "#F2EADF",
                                },
                                "&:disabled": {
                                    backgroundColor: "#CCCCCC",
                                },
                            }}
                            disableElevation
                            onClick={() => handleDownload(1)}
                        >
                            <img src={pdf} alt="icon" className="w-6 h-6 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                 
                }

                <Button className="w-48" variant="contained"
                    sx={{
                        backgroundColor: "#FFA500",
                        "&:hover": {
                            backgroundColor: "#FFA500",
                        },
                        "&:disabled": {
                            backgroundColor: "#CCCCCC",
                        },
                    }}
                    disableElevation
                    disabled={(notesBooks.length < total && urls.address && urls.address.length == 0) || urlsLoading}
                    onClick={handlePurchase}
                    startIcon={urlsLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {urls.address && urls.address.length > 0 ? "Purchase more" : "Purchase"} 
                </Button>
                {purchaseError && <p role="alert" className="text-red-600">{purchaseError}</p>}
                <p className="max-w-xs text-xs text-gray-600">
                    This site is protected by reCAPTCHA and the Google{" "}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">Privacy Policy</a> and{" "}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline">Terms of Service</a> apply.
                </p>
                {
                    urls.address && urls.address.length > 0 && 
                    <p>Warning: Select purchase more if you have downloaded previous documents.</p>
                }
            </div>
            <ConfirmationDialog
                open={open}
                handleClose={handleClose}
                handleClear={handleClear}
            />
            <ExpirationDialog
                expireOpen={expireOpen}
                handleExpireClose={handleExpireClose}
            />
        </div>
    );
};

export default Slab;
