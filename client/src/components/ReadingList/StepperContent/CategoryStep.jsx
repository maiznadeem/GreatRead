import { useEffect, useState } from 'react'
import { getCategories } from '../../../utils/api';
import Category from '../../../components/Category/Category';
import LinearProgress from '@mui/material/LinearProgress';

const CategoryStep = ({ isBookLoading, selectedCategories, handleCategoryClick }) => {

    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getCategories()
            .then((data) => {
                setCategories(data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(error.message);
                setIsLoading(false);
            });
    }, []);


    return (
        <div className='flex items-center justify-center h-[45px] w-full'>
            {isLoading ? (
                <div className='flex justify-center items-center w-1/3 min-w-[200px]'>
                    <LinearProgress sx={{ width: '100%', backgroundColor: '#cca170', '& .MuiLinearProgress-bar': { backgroundColor: '#8D5E20' } }} />
                    </div>
            ) : (
                <div className='flex w-[100%] gap-x-2 overflow-x-auto scrollbar-thin scrollbar-webkit'>
                    {categories.map((category) => (
                        <div key={category._id} className="shrink-0 mb-1">
                            <Category 
                                isBookLoading={isBookLoading}
                                category={category}
                                isActive={selectedCategories.includes(category.name)}
                                handleCategoryClick={handleCategoryClick}
                            />
                        </div>
                    ))}
                </div> 
            )}
        </div>
    )
}

export default CategoryStep