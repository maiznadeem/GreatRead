import { useState } from 'react';
import Skeleton from '@mui/material/Skeleton';

import amazonIcon from '../../assets/links/amazon.png';
import perlegoIcon from '../../assets/links/perlego.png';

const ExampleNote = ({ book }) => {

    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    return (
        <div className="rounded-lg w-full flex flex-row max-w-[1080px]">
            <div className='w-full flex flex-col sm:flex-row justify-center items-center'>
                <div className="w-36 h-56 sm:w-44 sm:h-64  rounded-lg shadow-2xl overflow-hidden shrink-0 z-10"
                >
                    { !isImageLoaded && 
                        <Skeleton 
                            variant="rectangular"
                            animation="wave"
                            width={200}
                            height={300}
                            sx={{ bgcolor: '#f0f0f0' }}
                        />
                    }
                    <img
                        src={book.image}
                        alt={book.title}
                        onLoad={handleImageLoad}
                        className={`object-cover w-full h-full transition-opacity duration-300 ease-in-out`}
                    />
                </div>
                <div className='h-[80%] z-10 w-full flex flex-col sm:flex-row flex-1 border-2 border-gray-400 border-dashed sm:border-l-0 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-xl sm:rounded-bl-none sm:rounded-tl-none'>
                    <div className='sm:w-1/2 flex flex-row bg-footer relative rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-xl sm:rounded-bl-none sm:rounded-tl-none'>
                        <div className='flex flex-col justify-center items-center z-10 px-6 py-10'>
                            <div className='flex justify-center items-center'>
                                <p className="manrope-regular text-gray-600 text-sm">&quot;{book.quote}&quot;</p>
                            </div>
                            <div className='absolute bottom-2 flex justify-center'>
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
                    </div>
                    <div className='w-full flex flex-col justify-center items-start p-4 pr-2'>
                        <h2 className='manrope-semibold'>Highlights</h2>
                        <div style={{ width: '100%', height: '200px' }} className='overflow-y-auto scrollbar-webkit scrollbar-thin'>
                                <ul className='list-disc list-inside mr-2' >
                                    { book.notes.map((note, index) => (
                                        <li key={index} className='text-xs'>
                                            {note}
                                        </li>
                                    ))}
                                </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            
        </div>
    );
}

export default ExampleNote