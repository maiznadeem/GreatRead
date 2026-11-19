import { useState, useEffect, useRef } from "react";
import Category from "../Category/Category";
import NotesBook from "./NotesBook";
import DefaultPagination from "../Category/DefaultPagination";
import { getBooks, getCategories } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";

import { useNotes } from "../../context/NotesContext";
import { pauseScrollAnchoring, scrollToListAndResumeAnchoring } from "../../utils/scroll";

const NotesBooks = () => {
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

    const { notesCategories } = useNotes();
    const scrollPending = useRef(false);

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            try {
                const data = await getCategories();
                setCategories(data);
                setCategoriesLoading(false);
            } catch (error) {
                console.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        setIsLoading(true);
        getBooks(
            (currentPage - 1) * limit,
            limit,
            activeCategories.length ? activeCategories : notesCategories,
            searchTerm
        )
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
    }, [currentPage, activeCategories, notesCategories]);

    useEffect(() => {
        setCurrentPage(1);
        setIsLoading(true);
        getBooks(
            0,
            limit,
            activeCategories.length ? activeCategories : notesCategories,
            searchTerm
        )
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

    // After a page or page-size change, scroll to the list once the new books have rendered.
    useEffect(() => {
        if (!isLoading && scrollPending.current) {
            scrollPending.current = false;
            scrollToListAndResumeAnchoring("notessection");
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
        getBooks(
            0,
            limit,
            activeCategories.length ? activeCategories : notesCategories,
            searchTerm
        )
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
        <section className="mx-4 sm:mx-8">
            <div>
                <div className="flex flex-wrap justify-center mb-6 sm:mb-14 gap-2">
                    {categories
                        .filter((category) => {
                            if (notesCategories.length)
                                return notesCategories.includes(category.name);
                            else return true;
                        })
                        .sort((a, b) => {
                            const nameA = a.name.toLowerCase();
                            const nameB = b.name.toLowerCase();
                            return nameA.localeCompare(nameB);
                        })
                        .map((category) => (
                            <Category
                                key={category._id}
                                isBookLoading={isLoading}
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
                            value={searchTerm}
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
                            id="notessection"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 xl2:grid-cols-4 mt-20 sm:mt-24 ml-4 sm:ml-8 gap-x-12 gap-y-20"
                        >
                            {books.map((book, index) => (
                                <NotesBook
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
                        className="manrope-semibold px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700"
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

export default NotesBooks;
