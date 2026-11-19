import { useState, useEffect, useRef } from "react";
import Category from "../Category/Category";
import Book from "./Book";
import DefaultPagination from "../Category/DefaultPagination";
import { getBooks, getCategories } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { useReadingList } from "../../context/ReadingListContext";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import { pauseScrollAnchoring, scrollToListAndResumeAnchoring } from "../../utils/scroll";

const Books = () => {
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(() => {
        return window.innerWidth <= 768 ? 12 : 72;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [activeCategories, setActiveCategories] = useState([]);
    const { pageRefresh, togglePageRefresh } = useReadingList();
    const scrollPending = useRef(false);

    useEffect(() => {
        setIsLoading(true);
        getCategories()
            .then((data) => {
                setCategories(data);
                setCategoriesLoading(false);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(error.message);
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        setIsLoading(true);
        getBooks((currentPage - 1) * limit, limit, activeCategories, searchTerm)
            .then((data) => {
                setBooks(data.books);
                setTotalCount(data.totalCount);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(error.message);
                setIsLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, activeCategories]);

    useEffect(() => {
        setCurrentPage(1);
        setIsLoading(true);
        getBooks(0, limit, activeCategories, searchTerm)
            .then((data) => {
                setBooks(data.books);
                setTotalCount(data.totalCount);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(error.message);
                setIsLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    useEffect(() => {
        if (pageRefresh) {
            setActiveCategories([]);
            setSearchTerm("");
            setCurrentPage(1);
            togglePageRefresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageRefresh]);

    // After a page or page-size change, scroll to the list once the new books have rendered.
    useEffect(() => {
        if (!isLoading && scrollPending.current) {
            scrollPending.current = false;
            scrollToListAndResumeAnchoring("booksection");
        }
    }, [isLoading]);

    const handlePageChange = (newPage) => {
        if (isLoading || newPage === currentPage) return;
        pauseScrollAnchoring();
        scrollPending.current = true;
        setCurrentPage(newPage);
    };

    const handleBooksPerPageChange = (newLimit) => {
        if (isLoading || newLimit === limit) return;
        pauseScrollAnchoring();
        scrollPending.current = true;
        setLimit(newLimit);
    };

    const handleCategoryClick = (categoryName) => {
        if (activeCategories.includes(categoryName)) {
            setActiveCategories((prevActiveCategories) =>
                prevActiveCategories.filter((cat) => cat !== categoryName)
            );
            setCurrentPage(1);
        } else {
            setActiveCategories((prevActiveCategories) => [
                ...prevActiveCategories,
                categoryName,
            ]);
            setCurrentPage(1);
        }
    };

    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
    };

    const handleSearchClick = () => {
        if (isLoading) return;
        setCurrentPage(1);
        setIsLoading(true);
        getBooks(0, limit, activeCategories, searchTerm)
            .then((data) => {
                setBooks(data.books);
                setTotalCount(data.totalCount);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(error.message);
                setIsLoading(false);
            });
    };

    return (
        <section className="mx-4 mt-10 sm:my-20 sm:mx-8">
            <div>
                <div className="flex flex-wrap justify-center mb-6 sm:mb-14 gap-2">
                    {categories
                        .sort((a, b) => {
                            const nameA = a.name.toLowerCase();
                            const nameB = b.name.toLowerCase();
                            return nameA.localeCompare(nameB);
                        })
                        .map((category) => (
                            <Category
                                isBookLoading={isLoading}
                                key={category._id}
                                category={category}
                                isActive={activeCategories.includes(
                                    category.name
                                )}
                                handleCategoryClick={handleCategoryClick}
                            />
                        ))}
                </div>
                {!categoriesLoading && (
                    <div className="w-full sm:max-w-[390px] sm:ml-2">
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search by title or author..."
                            onChange={handleSearchChange}
                            slotProps={{
                                input: {
                                    sx: {
                                        borderRadius: "8px",
                                        fontSize: 13,
                                    },
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon
                                                sx={{
                                                    fontSize: 22,
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <button
                                                onClick={handleSearchClick}
                                                className="manrope-semibold bg-primary text-white py-[5px] px-4 text-[12px] rounded-md shadow-lg hover:bg-primaryDark"
                                            >
                                                Search
                                            </button>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </div>
                )}
                {isLoading ? (
                    <div className="text-center text-black flex items-center justify-center h-[90vh]">
                        <CircularProgress sx={{ color: "#8D5E20" }} />
                    </div>
                ) : books.length === 0 ? (
                    <div className="manrope-semibold text-center text-gray-700 h-[90vh] flex items-center justify-center">
                        {(() => {
                            if (
                                !searchTerm &&
                                activeCategories.length < categories.length
                            ) {
                                return "No results. Try including more categories 🙂";
                            } else if (
                                searchTerm &&
                                ( activeCategories.length === categories.length || activeCategories.length === 0 )
                            ) {
                                return "No results. Maybe trying a different search term might help? 🙂";
                            } else {
                                return "No results. Let's try a different search or include more categories 🙂";
                            }
                        })()}
                    </div>
                ) : (
                    <>
                        <div
                            id="booksection"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 xl2:grid-cols-4 mt-20 sm:mt-24 ml-4 sm:ml-8 gap-x-12 gap-y-20"
                        >
                            {books.map((book, index) => (
                                <Book
                                    key={index}
                                    book={book}
                                    categories={categories}
                                    currentPage={currentPage}
                                />
                            ))}
                        </div>
                        <div className="mt-8 sm:mt-24 flex flex-col items-center justify-center overflow-hidden">
                            <DefaultPagination
                                currentPage={currentPage}
                                limit={limit}
                                totalResults={totalCount}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </>
                )}
                <div className="flex items-center justify-center text-xs sm:text-sm mb-8 sm:mb-0">
                    <label
                        htmlFor="booksPerPage"
                        className="manrope-semibold mr-2 text-gray-700"
                    >
                        Books per page:
                    </label>
                    <select
                        id="booksPerPage"
                        name="booksPerPage"
                        className="manrope-semibold px-2 py-1 border border-gray-300 rounded-md bg-backgroundPrimary text-gray-700"
                        value={limit}
                        onChange={(e) =>
                            handleBooksPerPageChange(Number(e.target.value))
                        }
                    >
                        <option value="12">12</option>
                        <option value="36">36</option>
                        <option value="72">72</option>
                        <option value="96">96</option>
                    </select>
                </div>
            </div>
        </section>
    );
};

export default Books;
