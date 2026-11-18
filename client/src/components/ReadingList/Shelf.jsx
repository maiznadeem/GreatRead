import { useEffect, useState, useRef, forwardRef, useMemo } from "react";
import { motion } from "motion/react";
import CircularProgress from "@mui/material/CircularProgress";
import waves from "../../assets/backgrounds/waves.png";
import enabled from "../../assets/buttons/enabled.svg";
import disabled from "../../assets/buttons/disabled.svg";
import remove from "../../assets/buttons/Remove.svg";
import { useReadingList } from "../../context/ReadingListContext";
import { getRandomBooks } from "../../utils/api";
import CategoryStep from "./StepperContent/CategoryStep";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import PDFModal from "./PDF/PDFModal";
import { SITE_URL } from "../../config";

const spring = { type: "spring", stiffness: 260, damping: 30 };

function slidesToShowFor(width) {
    if (width <= 600) return 2;
    if (width <= 800) return 3;
    if (width <= 950) return 4;
    if (width <= 1100) return 5;
    return 6;
}

const Shelf = forwardRef(function Shelf(props, ref) {
    const {
        name,
        goal,
        period,
        selectionChoice,
        books,
        selectedCategories,
        setSelectedCategoriesValue,
        updateBooksValue,
    } = useReadingList();

    const [isLoading, setIsLoading] = useState(false);
    const [windowSize, setWindowSize] = useState(window.innerWidth);
    const [page, setPage] = useState(0);
    const prevSelectedCategories = useRef(selectedCategories);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const trackRef = useRef(null);

    useEffect(() => {
        if (ref) {
            ref.current = trackRef.current;
        }
    }, [ref]);

    useEffect(() => {
        const handleResize = () => setWindowSize(window.innerWidth);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (
            selectedCategories.length &&
            selectedCategories !== prevSelectedCategories.current
        ) {
            setIsLoading(true);
            getRandomBooks(selectedCategories, goal, [])
                .then((randomBooks) => {
                    updateBooksValue(randomBooks);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error(error);
                    setIsLoading(false);
                });
        }
        prevSelectedCategories.current = selectedCategories;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategories]);

    const handleCategoryClick = (categoryName) => {
        if (selectedCategories.includes(categoryName)) {
            setSelectedCategoriesValue((prevActiveCategories) =>
                prevActiveCategories.filter((cat) => cat !== categoryName)
            );
        } else {
            setSelectedCategoriesValue((prevActiveCategories) => [
                ...prevActiveCategories,
                categoryName,
            ]);
        }
    };

    const slidesToShow = slidesToShowFor(windowSize);
    const maxRows = 2;
    const rows = Math.max(1, Math.min(maxRows, Math.ceil(books.length / slidesToShow)));
    const perPage = slidesToShow * rows;
    const pageCount = Math.max(1, Math.ceil(books.length / perPage));

    const pages = useMemo(() => {
        const out = [];
        for (let i = 0; i < books.length; i += perPage) {
            out.push(books.slice(i, i + perPage));
        }
        return out;
    }, [books, perPage]);

    useEffect(() => {
        if (page > pageCount - 1) setPage(0);
    }, [page, pageCount]);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const removeBook = (bookId) => {
        updateBooksValue(
            books.filter((readingBook) => readingBook._id !== bookId)
        );
    };

    const isStart = page === 0;
    const isEnd = page >= pageCount - 1;

    const shareUrl = SITE_URL;
    const plural = books.length > 1 ? `${books.length} books` : `1 book`;
    const postDescription =
        `I made a reading goal of ${plural} for ${period} on Great Read!\nCreate yours at: ${shareUrl}\n` +
        "Find books categorised as Procrastination Killers, Finding Yourself and Mind Tabs.";
    const linkedInShareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
        postDescription
    )}`;

    return (
        <div
            className="bg-footer py-3 px-6 sm:py-0 sm:px-8 rounded-xl w-full max-w-[680px]"
            style={{
                background: `url(${waves})`,
                backgroundPosition: "left top",
                backgroundSize: "600px",
            }}
        >
            <div className="flex flex-col items-center gap-4 sm:gap-4 py-4 sm:py-8">
                <p className="manrope-semibold text-center text-xl sm:text-2xl text-black">
                    {name}&apos;s Reading List
                </p>
                <div>
                    <p className="manrope-semibold text-center text-lg sm:text-xl text-primary">
                        {books.length} out of{" "}
                        {goal === 1 ? "1 book" : `${goal} books`}
                    </p>
                    <p className="manrope-semibold text-center text-lg sm:text-xl text-primary">
                        for {period}
                    </p>
                </div>
                {selectionChoice == "choose for me" && (
                    <CategoryStep
                        isBookLoading={isLoading}
                        selectedCategories={selectedCategories}
                        handleCategoryClick={handleCategoryClick}
                    />
                )}
                <div className="w-full flex justify-center items-center bg-footer border-2 border-gray-400 border-dashed rounded-xl min-h-[200px]">
                    {isLoading ? (
                        <CircularProgress sx={{ color: "#8D5E20" }} />
                    ) : books.length === 0 &&
                      selectionChoice == "i will choose" ? (
                        <p className="text-md sm:text-lg text-center manrope-regular text-gray-400">
                            Select books from below to add to your shelf.
                        </p>
                    ) : books.length === 0 &&
                      selectionChoice == "choose for me" ? (
                        <p className="text-md sm:text-lg text-center manrope-regular text-gray-400">
                            Select your categories and we will stack your
                            shelf.
                        </p>
                    ) : (
                        <div className="relative w-[90%] lg:w-[600px] p-2">
                            <img
                                src={disabled}
                                className={`h-8 w-8 absolute top-1/2 transform -translate-y-1/2 left-[-20px] cursor-pointer z-10 ${
                                    isStart ? "opacity-10 pointer-events-none" : ""
                                }`}
                                alt="Previous"
                                onClick={() => !isStart && setPage((p) => p - 1)}
                            />
                            <img
                                src={enabled}
                                className={`h-8 w-8 absolute top-1/2 transform -translate-y-1/2 right-[-20px] cursor-pointer z-10 ${
                                    isEnd ? "opacity-10 pointer-events-none" : ""
                                }`}
                                alt="Next"
                                onClick={() => !isEnd && setPage((p) => p + 1)}
                            />
                            <div className="overflow-hidden">
                                <motion.div
                                    ref={trackRef}
                                    className="flex"
                                    animate={{ x: `-${page * 100}%` }}
                                    transition={spring}
                                >
                                    {pages.map((pageBooks, pageIndex) => (
                                        <div
                                            key={pageIndex}
                                            className="grid w-full flex-shrink-0"
                                            style={{
                                                gridTemplateColumns: `repeat(${slidesToShow}, minmax(0, 1fr))`,
                                                gridAutoRows: "160px",
                                                gap: "8px",
                                            }}
                                        >
                                            {pageBooks.map((book) => (
                                                <div
                                                    key={book._id}
                                                    className="flex justify-center h-[160px] overflow-hidden"
                                                >
                                                    <div className="relative mt-[8px] mr-[8px]">
                                                        <img
                                                            src={remove}
                                                            alt={`Remove ${book.title} from list`}
                                                            className="h-4 w-4 absolute top-[-6px] right-[-6px] cursor-pointer"
                                                            onClick={() => removeBook(book._id)}
                                                        />
                                                        <img
                                                            src={book.image}
                                                            alt={book.title}
                                                            className="w-24 rounded-md shadow-md h-36 object-cover cursor-pointer"
                                                            onClick={() => removeBook(book._id)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-center items-center gap-3 w-full text-black text-xs">
                    <p className="text-sm sm:text-md text-center">
                        You will be able to download it as a PDF and/or share it
                        on your LinkedIn.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={handleOpenModal}
                            className={`w-28 rounded-lg shadow-lg px-2 py-1 flex justify-center items-center gap-1 bg-white
                            ${
                                books.length === 0
                                    ? " cursor-not-allowed opacity-50"
                                    : "opacity-100"
                            }`}
                            disabled={books.length === 0}
                        >
                            <PictureAsPdfIcon className="text-red-700" />
                            Download
                        </button>
                        <a
                            href={linkedInShareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`w-28 rounded-lg shadow-lg px-2 py-1 flex justify-center items-center gap-1 bg-white opacity-100`}
                        >
                            <LinkedInIcon className="text-blue-700" />
                            Share
                        </a>
                        <PDFModal
                            isModalOpen={isModalOpen}
                            handleCloseModal={handleCloseModal}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Shelf;
