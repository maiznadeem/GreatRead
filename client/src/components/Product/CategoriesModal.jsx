import { useEffect, useState } from "react";
import { Modal, Button, LinearProgress } from "@mui/material";
import { getCategories } from "../../utils/api";
import Category from "../Category/Category";
import { useNotes } from "../../context/NotesContext";

const CategoryStep = ({ selectedCategories, handleCategoryClick }) => {
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
        <div className="flex items-start justify-center max-h-[500px] overflow-y-auto">
            {isLoading ? (
                <div className="flex justify-center items-center w-1/3 min-w-[200px]">
                    <LinearProgress
                        sx={{
                            width: "100%",
                            backgroundColor: "#cca170",
                            "& .MuiLinearProgress-bar": {
                                backgroundColor: "#8D5E20",
                            },
                        }}
                    />
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <div key={category._id} className="shrink-0">
                            <Category
                                isBookLoading={false}
                                category={category}
                                isActive={selectedCategories.includes(
                                    category.name
                                )}
                                handleCategoryClick={handleCategoryClick}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CategoriesModal = ({
    openModal,
    handleModalClose,
    handleCategoryConfirm,
}) => {

    const { selectedButton, notesCategories, setNotesCategories } = useNotes();
    const [statusText, setStatusText] = useState("Is this correct?");
    const [maxUniqueCategoryLimit, setMaxUniqueCategoryLimit] = useState(1);

    const handleCategoryClick = (categoryName) => {
        let maxUniqueCategoryLimit = 1;
        if (selectedButton === 2) maxUniqueCategoryLimit = 3;
        else if (selectedButton == 3) maxUniqueCategoryLimit = Infinity;

        if (notesCategories.includes(categoryName)) {
            setNotesCategories((prevActiveCategories) =>
                prevActiveCategories.filter((cat) => cat !== categoryName)
            );
        } else if (notesCategories.length < maxUniqueCategoryLimit) {
            setNotesCategories((prevActiveCategories) => [
                ...prevActiveCategories,
                categoryName,
            ]);
        }
    };

    const handleConfirm = () => {
        if (notesCategories.length >= maxUniqueCategoryLimit) {
            handleCategoryConfirm();
        }
    };

    useEffect(() => {
        if (selectedButton === 2) setMaxUniqueCategoryLimit(3);
        else if (selectedButton === 3) setMaxUniqueCategoryLimit(Infinity);
        else setMaxUniqueCategoryLimit(1);
        if (notesCategories.length < maxUniqueCategoryLimit) {
            setStatusText(`Select at least ${maxUniqueCategoryLimit} ${maxUniqueCategoryLimit == 1 ? 'category.' : 'categories.' }`);
        } else {
            setStatusText("Limit reached. Choose a different plan to add more categories.");
        }
    }, [selectedButton, notesCategories, maxUniqueCategoryLimit]);

    return (
        <Modal
            open={openModal}
            onClose={handleModalClose}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div className="bg-footer px-8 py-8 rounded-xl lg:max-w-[1000px] m-4 sm:m-8 flex flex-col justify-center items-center gap-4">
                <CategoryStep
                    selectedCategories={notesCategories}
                    handleCategoryClick={handleCategoryClick}
                />
                <p className={notesCategories.length < maxUniqueCategoryLimit ? "text-red-500" : "text-black"}>{statusText}</p>
                <div className="flex gap-4">
                    <Button onClick={handleConfirm} variant="contained">
                        Confirm
                    </Button>
                    <Button onClick={handleModalClose}>Cancel</Button>
                </div>
            </div>
        </Modal>
    );
};

export default CategoriesModal;
