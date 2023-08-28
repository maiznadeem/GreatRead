import React, { useState, useEffect } from 'react';
import Category from './Category';
import Book from './Book';
import DefaultPagination from './DefaultPagination';
import categoriesData from '../utils/categoriesData';
import { getBooks } from '../utils/api';
import { ClipLoader } from 'react-spinners';

const Books = () => {
    const [books, setBooks] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(12);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategories, setActiveCategories] = useState([]);

    useEffect(() => {
        setIsLoading(true);
        getBooks((currentPage - 1) * limit, limit, activeCategories)
            .then((data) => {
                setBooks(data.books);
                setTotalCount(data.totalCount);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(error.message);
                setIsLoading(false);
            });
    }, [currentPage, limit, activeCategories]);    

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleBooksPerPageChange = (newLimit) => {
        setLimit(newLimit);
        setCurrentPage(1);
    };

    const handleCategoryClick = (categoryName) => {
        if (activeCategories.includes(categoryName)) {
            setActiveCategories((prevActiveCategories) =>
                prevActiveCategories.filter((cat) => cat !== categoryName)
            );
        } else {
            setActiveCategories((prevActiveCategories) => [
                ...prevActiveCategories,
                categoryName,
            ]);
        }
    };

    return (
        <section className='mx-4 sm:my-24 sm:mx-8'>
            <div>
                <p className='manrope-semibold py-6 sm:py0 text-3xl sm:text-5xl text-black text-center'>Discover <span className='text-primaryDark'>3000+</span> books to find your best self.</p>
                <div className='flex flex-wrap justify-center my-6 sm:my-14 gap-2'>
                    {categoriesData.map((category) => (
                        <Category key={category.id} category={category} handleCategoryClick={handleCategoryClick} />
                    ))}
                </div>
                {isLoading ? (
                    <div className='text-center text-black flex items-center justify-center h-96'>
                        <ClipLoader color={'#000'} loading={isLoading} size={50} /> {/* Use the ClipLoader component */}
                    </div>
                ) : (
                    <>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 xl2:grid-cols-4 mt-32 ml-4 sm:ml-8 gap-x-12 gap-y-20'>
                            {books.map((book, index) => (
                                <Book key={index} book={book} />
                            ))}
                        </div>
                        <div className='mt-24 flex flex-col items-center justify-center scale-65 sm:scale-100'>
                            <DefaultPagination
                                currentPage={currentPage}
                                limit={limit}
                                totalResults={totalCount}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </>
                )}
                <div className="flex items-center justify-center text-sm">
                    <label htmlFor="booksPerPage" className="manrope-semibold mr-2 text-gray-700">
                        Books per page:
                    </label>
                    <select
                        id="booksPerPage"
                        name="booksPerPage"
                        className="manrope-semibold px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700"
                        value={limit}
                        onChange={(e) => handleBooksPerPageChange(Number(e.target.value))}
                    >
                        <option value="12">12</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
            </div>
        </section>
    );
};

export default Books;
