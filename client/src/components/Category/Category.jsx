
const Category = ({ isBookLoading, category, isActive, handleCategoryClick }) => {  

    const handleClick = () => {
        if(isBookLoading)
            return;
        handleCategoryClick(category.name);
    };

    const containerClasses = `bg-${isActive ? 'primary' : 'backgroundPrimary'} border border-primary h-full rounded-lg shadow-md p-2 flex items-center justify-between hover:cursor-pointer transition-all duration-300 ease-in-out`;
    const textClasses = `text-${isActive ? 'white' : 'black'} manrope-semibold text-xs sm:text-md`;

    const image = category.image ? (
        <img src={category.image} alt={category.name} className={`h-3 w-3 sm:w-4 sm:h-4 filter ${isActive ? 'invert' : 'none'}`} />
    ) : null;

    return (
        <div
            className={containerClasses}
            onClick={handleClick}
        >
            <div className="flex items-center space-x-2">
                {image}
                <span className={textClasses}>{category.name}</span>
            </div>
        </div>
    );
};

export default Category;
