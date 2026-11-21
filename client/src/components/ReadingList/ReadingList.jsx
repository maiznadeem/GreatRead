import { motion } from 'motion/react';
import { IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ReadingListForm from './ReadingListForm';
import { useReadingList } from '../../context/ReadingListContext';
import Shelf from './Shelf';

const ReadingList = () => {
    const { readingInfo, isReadingListActive, toggleReadingList } = useReadingList();

    const handleReadingListClose = () => {
        toggleReadingList();
    }

    return (
        <div id='readinglistsection' className='flex flex-col items-center w-full mt-10 sm:mt-20'>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: isReadingListActive ? 1 : 0,
                    scale: isReadingListActive ? 1 : 0.8,
                }}
                transition={{
                    opacity: { type: 'spring', stiffness: 100, damping: 20 },
                    scale: { type: 'spring', stiffness: 180, damping: 12 },
                }}
                className={`flex flex-col items-center gap-4 rounded-xl shadow-xl ${readingInfo ? 'w-full sm:w-[80%] md:w-[100%] max-w-[680px]' : 'max-w-full md:max-w-[600px]'}`}
            >
                <IconButton
                    onClick={handleReadingListClose}
                    sx={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        color: 'text.primary',
                    }}
                >
                    <ClearIcon />
                </IconButton>
                {readingInfo ? (
                    <Shelf />
                ) : (
                    <ReadingListForm />
                )}
            </motion.div>
        </div>
    );
};

export default ReadingList;
