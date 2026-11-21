import { useState, useEffect } from 'react';
import Skeleton from '@mui/material/Skeleton';

import amazonIcon from '../../assets/links/amazon.png';
import perlegoIcon from '../../assets/links/perlego.png';
import invertedLeft from '../../assets/links/inverted-comma-left.svg'
import invertedrRight from '../../assets/links/inverted-comma-right.svg'
import add from "../../assets/buttons/Add.svg";
import remove from "../../assets/buttons/Remove.svg";
import tick from "../../assets/buttons/tick.png";
import { useReadingList } from '../../context/ReadingListContext';
import { Tooltip } from '@mui/material';
import Zoom from '@mui/material/Zoom';

const CategoryIcon = ({ category, categories }) => {
    const [showtooltip, setshowtooltip] = useState(false);
    const matchingCategory = categories.find(item => item.name === category);

    if (!matchingCategory || !matchingCategory.image) {
        return null;
    }

    return (
        <Tooltip
            title={matchingCategory.name}
            open={showtooltip}
            slots={{ transition: Zoom }}
            onOpen={() => setshowtooltip(true)}
            onClose={() => setshowtooltip(false)}
        >
            <img
                src={matchingCategory.image}
                alt={`${matchingCategory.name} category`}
                onClick={() => setshowtooltip(!showtooltip)}
                className="w-auto h-6 cursor-pointer"
            />
        </Tooltip>
    );
};

const Book = ({ book, categories }) => {

    const { books, goal, updateBooksValue, isReadingListActive, contextTopPicks } = useReadingList();
    const [isBookInReadingList, setIsBookInReadingList] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    useEffect(() => {
        setIsBookInReadingList(books.some((readingBook) => readingBook._id === book._id));
    }, [books, book]);

    const categoryIcons = book.categories.map(category => (
        <CategoryIcon key={category} category={category} categories={categories} />
    ));

    return (
        <div className="rounded-lg p-4 flex flex-col border-2 border-gray-400 border-dashed overflow-visible relative">
            <div className='flex flex-row gap-4'>
                <div className={`w-32 h-52 sm:w-40 sm:h-64 relative rounded-lg shadow-xl -mt-16 -ml-10 overflow-hidden shrink-0 ${isReadingListActive ? 'cursor-pointer' : '' } ${isBookInReadingList && isReadingListActive ? 'bg-black' : ''}`}
                    onClick={() => {
                        if (isReadingListActive) {   
                            if (isBookInReadingList) {
                                updateBooksValue(books.filter((readingBook) => readingBook._id !== book._id));
                                setIsBookInReadingList(false);
                            } else if (books.length < goal) {
                                updateBooksValue([...books, book]);
                                setIsBookInReadingList(true);
                            }
                        }
                    }}
                >
                    { !isImageLoaded && 
                        <Skeleton 
                            variant="rectangular"
                            animation="wave"
                            width={160}
                            height={280}
                            sx={{ bgcolor: '#f0f0f0' }}
                        />
                    }
                    <img
                        src={book.image}
                        alt={book.title}
                        onLoad={handleImageLoad}
                        className={`object-cover w-full h-full transition-opacity duration-300 ease-in-out ${isBookInReadingList && isReadingListActive ? 'opacity-30' : 'opacity-100'}`}
                    />
                    { isReadingListActive && isBookInReadingList &&
                        <div className='absolute inset-0 flex flex-col justify-center items-center gap-2'>
                            <img src={tick} alt="Tick Icon" className="transition-opacity duration-300 ease-in-out" />
                            <p className='manrope-semibold text-white text-center transition-opacity duration-300 ease-in-out'>On Shelf</p>
                        </div>
                    }
                </div>
                <div className='flex justify-center items-center w-[100%]'>
                    <img className='absolute -top-4 left-32 sm:left-36' src={invertedLeft} alt='Inverted-Left' />
                    <img className='absolute bottom-14 -right-4' src={invertedrRight} alt='Inverted-Right' />
                    { isReadingListActive ? 
                        <>
                        {isBookInReadingList ? (
                            <img 
                                src={remove}
                                alt={`Remove ${book.title} from list`}
                                className='h-8 w-8 absolute top-[-15px] right-[-15px] cursor-pointer'
                                onClick={() => {
                                    updateBooksValue(books.filter((readingBook) => readingBook._id !== book._id));
                                    setIsBookInReadingList(false);
                                }}
                            />
                        ) : (
                            books.length < goal && (
                                <img 
                                    src={add}
                                    alt={`Add ${book.title} to list`}
                                    className='h-8 w-8 absolute top-[-15px] right-[-15px] cursor-pointer'
                                    onClick={() => {
                                        updateBooksValue([...books, book]);
                                        setIsBookInReadingList(true);
                                    }}
                                />
                            )
                        )}
                        </>
                        : (
                            contextTopPicks?.books ? contextTopPicks.books.find(contextTopPick => contextTopPick._id == book._id) && (
                                <div className='manrope-semibold text-center text-xs w-32 bg-black px-4 py-2 rounded-lg shadow-lg absolute top-[-15px] right-[-15px] cursor-pointer'>
                                    <p>Featured</p>
                                </div>
                            ) : <></>
                        )
                    }
                    <p className="manrope-regular text-gray-600 text-xs sm:text-sm">{book.quote}</p>
                </div>
            </div>
            <div className='flex mt-4 justify-between'>
                <div className="flex space-x-4">
                    {categoryIcons}
                </div>
                <div className="flex space-x-2 items-center">
                    { book.amazon &&  <img
                        src={amazonIcon}
                        alt="Amazon"
                        className="w-auto h-4 cursor-pointer hover:tooltip"
                        title="Amazon"
                        onClick={() => {window.open(book.amazon, '_blank')}}
                    />}
                    { book.perlego && <img
                        src={perlegoIcon}
                        alt="Perlego"
                        className="w-auto h-4 cursor-pointer hover:tooltip"
                        title="Perlego"
                        onClick={() => {window.open(book.perlego, '_blank')}}
                    />}
                </div>
            </div>
        </div>
    );
};

export default Book;
