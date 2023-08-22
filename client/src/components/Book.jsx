import React from 'react';

import amazonIcon from '../assets/links/amazon.png';
import perlegoIcon from '../assets/links/perlego.png';
import invertedLeft from '../assets/links/inverted-comma-left.svg'
import invertedrRight from '../assets/links/inverted-comma-right.svg'

import categoriesData from '../utils/categoriesData';

const Book = ({ book }) => {
    const categoryIcons = book.categories.map(category => {
        const matchingCategory = categoriesData.find(item => item.name === category);
        if (matchingCategory) {
            return (
                <img
                    key={matchingCategory.id}
                    src={matchingCategory.image}
                    alt={matchingCategory.name}
                    title={matchingCategory.name}
                    className="w-auto h-6 cursor-pointer hover:tooltip"
                />
            );
        }
        return null;
    });

    const openLinkInNewTab = (link) => {
        window.open(link, '_blank');
    };

    return (
        <div className="rounded-lg p-4 flex flex-col border-2 border-gray-400 border-dashed overflow-visible relative">
            <div className='flex flex-row gap-4 flex-1'>
                <img
                    src={book.image}
                    alt={book.title}
                    className="h-56 w-auto rounded-lg -mt-16 -ml-10 max-h-56 shadow-xl"
                />
                <div className='flex justify-center items-center'>
                    <img className='absolute -top-4 left-32' src={invertedLeft} alt='Inverted-Left' />
                    <img className='absolute bottom-14 -right-4' src={invertedrRight} alt='Inverted-Right' />
                    <p className="manrope-regular text-gray-600 text-sm">{book.notableQuote}</p>
                </div>
            </div>
            <div className='flex mt-4 justify-between'>
                <div className="flex space-x-4">{categoryIcons}</div>
                <div className="flex space-x-2 items-center">
                    <img
                        src={amazonIcon}
                        alt="Amazon"
                        className="w-auto h-4 cursor-pointer hover:tooltip"
                        title="Amazon"
                        onClick={() => openLinkInNewTab(book.amazon)}
                    />
                    <img
                        src={perlegoIcon}
                        alt="Perlego"
                        className="w-auto h-4 cursor-pointer hover:tooltip"
                        title="Perlego"
                        onClick={() => openLinkInNewTab(book.perlego)}
                    />
                </div>
            </div>
        </div>
    );
};

export default Book;

