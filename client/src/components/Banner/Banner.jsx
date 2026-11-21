import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopPicks } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import TopPickCarousel from './TopPickCarousel';
import TopPickCard from './TopPickCard';
import { useReadingList } from '../../context/ReadingListContext';

const Banner = () => {
    const [topPicks, setTopPicks] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const history = useNavigate();
    const { isReadingListActive, toggleReadingList, setContextTopPicks } = useReadingList();
    
    const getMonthName = (monthNumber) => {
        const months = [
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
        ];
        return months[monthNumber - 1];
    };

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthText = getMonthName(currentMonth);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const topPicksData = await getTopPicks();
                setTopPicks(topPicksData);
                setContextTopPicks(topPicksData);
                setIsLoading(false);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, [setContextTopPicks]);

    let cards = [
        {
            key: 1,
            content: (
                <TopPickCard book={topPicks?.books[0]} />
            )
        },
        {
            key: 2,
            content: (
                <TopPickCard book={topPicks?.books[1]} />
            )
        },
        {
            key: 3,
            content: (
                <TopPickCard book={topPicks?.books[2]} />
            )
        },
    ]

    const handleReadingListClick = () => {
        if (isReadingListActive) {
            toggleReadingList();
        } else {
            toggleReadingList();
            setTimeout(() => {
                const targetElement = document.getElementById("readinglistsection");
                if (targetElement) {
                    const targetHeight = targetElement.clientHeight;
                    const windowHeight = window.innerHeight;
                    const offset = targetElement.offsetTop - (windowHeight - targetHeight) / 2;
                    window.scrollTo({ top: offset, behavior: "smooth" });
                }
            }, 50);
        }
    };
    
    const handleNotesButtonClick = () => {
        history("/notes");
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 500)
    }

    return (
        <section className='flex mt-8 smmt-12 justify-center items-center'>
            {isLoading ? (
                <div className='text-center flex items-center justify-center min-h-[60vh] w-full'>
                    <CircularProgress sx={{ color: '#8D5E20' }} />
                </div>
            ) : (
            <>
                <div className='w-full sm:w-[90%] custsm:w-[100%] lg:w-[90%] max-w-[1100px] gap-6 sm:gap-8 flex flex-col items-center'>
                    <div className='flex flex-col items-center gap-6 sm:gap-8 pb-6'>
                        <p className='manrope-semibold text-3xl sm:text-4xl text-black text-center max-w-[600px]'>
                            <span className='text-primaryDark'>Think</span> Better.
                            <span className='text-primaryDark'> Be</span> Better.
                            <span className='block sm:inline'><span className='text-primaryDark'> Do</span> Better.</span>
                        </p>
                        <p className='manrope-semibold text-lg sm:text-xl text-black text-center max-w-[350px] sm:max-w-[380px]'>
                            The internet&apos;s<span className='text-primaryDark'> largest </span>destination for <span className='text-primaryDark'>non-fiction books</span> that will inspire you.
                        </p>
                    </div>
                    <div className='flex w-full justify-between gap-4 flex-wrap custmd:flex-nowrap'>
                        <div className='w-full lg:w-1/3 flex flex-col justify-between items-start bg-[#EFE5D8] rounded-xl shadow-xl relative px-6 lg:px-12 py-6 sm:py-8'>
                            <p className='manrope-semibold text-2xl custlg:text-3xl text-black'>
                                Insights & Ideas
                            </p>
                            <p className='manrope-semibold text-lg custlg:text-xl py-4 text-black max-w-[400px]'>
                                Access notes containing key ideas, insights and concepts from over 3,000 books for a <span className='text-primaryDark'>fraction of the time and money </span> to read them.
                            </p>
                            <div className='w-full flex justify-center'>
                                <button
                                    onClick={handleNotesButtonClick}
                                    className="manrope-semibold bg-primary text-white py-[6px] px-6 text-[14px] rounded-md shadow-lg hover:bg-primaryDark"
                                >
                                    Save me money and time   
                                </button>
                            </div>
                        </div>
                        <div className='w-full lg:w-1/3 flex flex-col justify-between items-center bg-[#EFE5D8] rounded-xl shadow-xl px-6 lg:px-12 py-6 sm:py-8 relative order-first custmd:order-none'>
                            <p className='manrope-semibold text-2xl custlg:text-3xl text-center text-black'>
                                Top 3 Picks
                            </p>
                            <div className='flex justify-center items-center w-[100%] max-w-[500px] scale-75'>
                                <TopPickCarousel
                                    cards={cards}
                                    height="250px"
                                    width="80%"
                                    margin="0 auto"
                                    showArrows={false}
                                />
                            </div>
                            <p className='manrope-semibold text-2xl custlg:text-3xl text-center text-black'>
                                {currentMonthText} {currentYear}
                            </p>
                        </div>
                        <div className='w-full lg:w-1/3 flex flex-col justify-between items-start bg-[#EFE5D8] rounded-xl shadow-xl relative px-6 lg:px-12 py-6 sm:py-8'>
                            <p className='manrope-semibold text-2xl custlg:text-3xl text-black'>
                                Reading List
                            </p>
                            <p className='manrope-semibold text-lg custlg:text-xl pt-4 pb-1 text-black'>
                                Your next <span className='text-primaryDark'>career move, inspiration or motivation</span> can be in one of the books you choose to read.
                            </p>
                            <p className='manrope-semibold text-lg custlg:text-xl pb-4 pt-1 text-black'>
                                What are you waiting for?
                            </p>
                            <div className='w-full flex justify-center'>
                                <button
                                    onClick={handleReadingListClick}
                                    className="manrope-semibold bg-primary text-white py-[6px] px-6 text-[14px] w-36 rounded-md shadow-lg hover:bg-primaryDark"
                                >
                                    Start    
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
            )}
        </section>
    );
};

export default Banner;
