import { useState, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { useLocation } from 'react-router-dom';
import SelectProduct from '../components/Product/SelectProduct';
import Preview from '../components/Product/Preview';
import { useNotes } from "../context/NotesContext";
import { exampleBooks } from '../components/Product/PreviewAndExamples';
import ExampleNote from '../components/Product/ExampleNote';
import Slab from '../components/Slab/Slab';
import NotesBooks from '../components/Slab/NotesBooks';
import CategoriesModal from '../components/Product/CategoriesModal';
import { getPaymentDetails } from '../utils/api';
import { loadRecaptcha } from '../utils/recaptcha';

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 90000;

const Notes = () => {

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('id');

    const { selectedButton, setSelectedButton, previewOptions, setPreviewOptions, setNotesBooks, setNotesCategories, setUrls, setUrlsLoading } = useNotes();

    const [openModal, setOpenModal] = useState(false);
    // idle | loading | preparing | ready | error
    const [paymentStatus, setPaymentStatus] = useState(sessionId ? 'loading' : 'idle');
    const [paymentError, setPaymentError] = useState('');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => { loadRecaptcha(); }, []);

    const handleRetry = () => {
        setPaymentError('');
        setPaymentStatus('loading');
        setAttempt((prev) => prev + 1);
    };

    const handleButtonClick = (value) => {
        setNotesBooks([]);
        setSelectedButton(value === selectedButton ? null : value);
        setNotesCategories([]);
        if (value != selectedButton && value != 3) {
            setOpenModal(true);
        }
    };

    const handleModalClose = () => {
        setNotesBooks([]);
        setSelectedButton(null);
        setNotesCategories([]);
        setOpenModal(false);
    };

    const handleCategoryConfirm = () => {
        setOpenModal(false);
    }

    useEffect(() => {
        if (!sessionId) return undefined;

        let cancelled = false;
        let timer;
        let applied = false;
        const startedAt = Date.now();

        const finish = (status, message = '') => {
            setUrlsLoading(false);
            setPaymentStatus(status);
            setPaymentError(message);
        };

        const poll = async () => {
            try {
                const data = await getPaymentDetails(sessionId);
                if (cancelled) return;

                if (!data.fetchedBefore && !applied) {
                    applied = true;
                    setSelectedButton(data.selectedButton);
                    setPreviewOptions(data.previewOptions);
                    setNotesBooks(data.books);
                    setNotesCategories(data.categories);
                }

                // Stripe's cancel_url also lands here: an unpaid payment just restores the selection.
                if (!data.success) {
                    finish('idle');
                    return;
                }

                if (data.generationFailed) {
                    finish('error', "We couldn't prepare your notes. Please try again.");
                    return;
                }

                if (data.urls?.length > 0 && !data.processing) {
                    setUrls({
                        address: data.urls,
                        timeCreated: data.urlsGeneratedAt || data.createdAt,
                    });
                    finish('ready');
                    return;
                }

                if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
                    finish('error', 'Your notes are taking longer than expected to prepare. Please try again in a moment.');
                    return;
                }

                setUrlsLoading(true);
                setPaymentStatus('preparing');
                timer = setTimeout(poll, POLL_INTERVAL_MS);
            } catch (error) {
                if (cancelled) return;
                console.error('Error fetching payment details:', error);
                finish('error', error.message || 'Something went wrong while loading your notes. Please try again.');
            }
        };

        setUrlsLoading(true);
        poll();

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, attempt]);

    return (
        <section className='my-6 sm:my-20 mx-4 sm:mx-8 min-h-screen'>
            <div className='flex flex-col items-center justify-center w-full'>
                {(paymentStatus === 'loading' || paymentStatus === 'preparing') && (
                    <div role="status" className='flex items-center gap-3 mb-6 text-black text-center'>
                        <CircularProgress size={24} />
                        <p>
                            {paymentStatus === 'preparing'
                                ? 'Preparing your notes. This can take up to a minute, please keep this page open.'
                                : 'Checking your payment...'}
                        </p>
                    </div>
                )}
                {paymentStatus === 'error' && (
                    <div role="alert" className='flex flex-col items-center gap-3 mb-6 text-black text-center'>
                        <p>{paymentError}</p>
                        <Button variant="contained" disableElevation onClick={handleRetry}
                            sx={{ backgroundColor: "#FFA500", "&:hover": { backgroundColor: "#FFA500" } }}>
                            Try again
                        </Button>
                    </div>
                )}
                <div className='w-full max-w-[700px]'>
                    <SelectProduct selectedButton={selectedButton} handleButtonClick={handleButtonClick} />
                </div>
                <CategoriesModal openModal={openModal} handleModalClose={handleModalClose} handleCategoryConfirm={handleCategoryConfirm} />
                { 
                    !selectedButton ?
                    <>
                        <Preview previewOptions={previewOptions} setPreviewOptions={setPreviewOptions} />
                        <div className='text-black w-full max-w-[1280px]'>
                            <h1 className='text-left text-primary manrope-semibold text-3xl py-4 sm:py-8'>Examples</h1>
                            <div className='flex flex-col justify-center items-center gap-6'>
                                {exampleBooks.map((book, index) => (
                                    <ExampleNote key={index} book={book} />
                                ))}
                            </div>
                        </div>
                    </>
                    : 
                    <div className='w-full overflow-hidden'>
                        <Slab />
                        <NotesBooks />
                    </div>
                }

            </div>
        </section>
    );
};

export default Notes;
