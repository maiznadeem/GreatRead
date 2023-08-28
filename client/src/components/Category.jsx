import React, { useState } from 'react';

const Category = ({ category, handleCategoryClick }) => {
    const [isActive, setIsActive] = useState(false);

    const handleClick = () => {
        setIsActive(!isActive);
        handleCategoryClick(category.name);
    };

    const containerClasses = `bg-${isActive ? 'primary' : 'white'} rounded-lg shadow-md p-2 flex items-center justify-between hover:cursor-pointer transition-all duration-300 ease-in-out`;
    const textClasses = `text-${isActive ? 'white' : 'black'} manrope-semibold text-xs sm:text-md`;
    const imageClasses = `h-3 w-3 sm:w-4 sm:h-4 filter ${isActive ? 'invert' : 'none'}`;

    return (
        <div
            className={containerClasses}
            onClick={handleClick}
        >
            <div className="flex items-center space-x-2">
                <img src={category.image} alt={category.name} className={imageClasses} />
                <span className={textClasses}>{category.name}</span>
            </div>
        </div>
    );
};

export default Category;
