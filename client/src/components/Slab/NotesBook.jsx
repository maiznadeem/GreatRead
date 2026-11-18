import { useState, useEffect } from 'react';
import Skeleton from '@mui/material/Skeleton';

import amazonIcon from '../../assets/links/amazon.png';
import perlegoIcon from '../../assets/links/perlego.png';
import invertedLeft from '../../assets/links/inverted-comma-left.svg'
import invertedrRight from '../../assets/links/inverted-comma-right.svg'
import add from "../../assets/buttons/Add.svg";
import remove from "../../assets/buttons/Remove.svg";
import tick from "../../assets/buttons/tick.png";
import { useNotes } from '../../context/NotesContext';
import { Tooltip } from '@mui/material';
import Zoom from '@mui/material/Zoom';

const NotesBook = ({ book, categories }) => {

    const { notesBooks, setNotesBooks, selectedButton, addBook, urls, urlsLoading } = useNotes();
    const [isBookInReadingList, setIsBookInReadingList] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    let total = 10;
    if (selectedButton == 3) {
        total = 30;
    }
    
    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    useEffect(() => {
        setIsBookInReadingList(notesBooks.some((readingBook) => readingBook._id === book._id));
    }, [notesBooks, book]);

    const [showTooltips, setShowTooltips] = useState(Array(book.categories.length).fill(false));

    const categoryIcons = book.categories.map((category, index) => {
        const matchingCategory = categories.find(item => item.name === category);
        if (matchingCategory && matchingCategory.image) {
            return (
                <Tooltip
                    key={matchingCategory._id}
                    title={matchingCategory.name}
                    open={showTooltips[index]}
                    slots={{ transition: Zoom }}
                    onOpen={() => setShowTooltips(prevState => [...prevState.slice(0, index), true, ...prevState.slice(index + 1)])}
                    onClose={() => setShowTooltips(prevState => [...prevState.slice(0, index), false, ...prevState.slice(index + 1)])}
                >
                    <img
                        src={matchingCategory.image}
                        alt={`${matchingCategory.name} category`}
                        onClick={() => setShowTooltips(prevState => [...prevState.slice(0, index), !prevState[index], ...prevState.slice(index + 1)])}
                        className="w-auto h-6 cursor-pointer"
                    />
                </Tooltip>
            );
        }
        return null;
    });


    return (
        <div className="rounded-lg p-4 flex flex-col border-2 border-gray-400 border-dashed overflow-visible relative">
            <div className='flex flex-row gap-4'>
                <div className={`w-32 h-52 sm:w-40 sm:h-64 relative rounded-lg shadow-xl -mt-16 -ml-10 overflow-hidden flex-shrink-0 cursor-pointer ${isBookInReadingList ? 'bg-black' : ''}`}
                    onClick={() => {
                        if (urls.address.length == 0 && !urlsLoading) {
                            if (notesBooks.some((readingBook) => readingBook._id === book._id)) {
                                setNotesBooks(notesBooks.filter((readingBook) => readingBook._id !== book._id));
                            }
                            else if(notesBooks.length < total) {
                                addBook(book);
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
                        className={`object-cover w-full h-full transition-opacity duration-300 ease-in-out ${isBookInReadingList ? 'opacity-30' : 'opacity-100'}`}
                    />
                    { isBookInReadingList &&
                        <div className='absolute inset-0 flex flex-col justify-center items-center gap-2'>
                            <img src={tick} alt="Tick Icon" className="transition-opacity duration-300 ease-in-out" />
                            <p className='manrope-semibold text-white text-center transition-opacity duration-300 ease-in-out'>Added</p>
                        </div>
                    }
                </div>
                <div className='flex justify-center items-center w-[100%]'>
                    <img className='absolute -top-4 left-32 sm:left-36' src={invertedLeft} alt='Inverted-Left' />
                    <img className='absolute bottom-14 -right-4' src={invertedrRight} alt='Inverted-Right' />
                    {isBookInReadingList ? (
                        <img 
                            src={remove}
                            alt={`Remove ${book.title} from list`}
                            className='h-8 w-8 absolute top-[-15px] right-[-15px] cursor-pointer'
                            onClick={() => {
                                if (urls.address.length == 0 && !urlsLoading)
                                    setNotesBooks(notesBooks.filter((readingBook) => readingBook._id !== book._id));
                            }}
                        />
                    ) : (
                        notesBooks.length < total && (
                            <img 
                                src={add}
                                alt={`Add ${book.title} to list`}
                                className='h-8 w-8 absolute top-[-15px] right-[-15px] cursor-pointer'
                                onClick={() => {
                                    if (urls.address.length == 0 && !urlsLoading)
                                        addBook(book);
                                }}
                            />
                        )
                    )}
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
                        className="w-auto h-4 cursor-pointer"
                        title="Amazon"
                        onClick={() => {window.open(book.amazon, '_blank')}}
                    />}
                    { book.perlego && <img
                        src={perlegoIcon}
                        alt="Perlego"
                        className="w-auto h-4 cursor-pointer"
                        title="Perlego"
                        onClick={() => {window.open(book.perlego, '_blank')}}
                    />}
                </div>
            </div>
        </div>
    );
};

export default NotesBook;
