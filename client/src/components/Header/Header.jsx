import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/logos/Logo.svg";
import { useReadingList } from "../../context/ReadingListContext";

const Header = () => {
    const [isHidden, setIsHidden] = useState(false);
    const [isAtTop, setIsAtTop] = useState(true);
    const location = useLocation();
    const history = useNavigate();

    const { isReadingListActive, toggleReadingList } = useReadingList();

    useEffect(() => {
        let lastScrollTop = 0;
        const handleScroll = () => {
            const currentScrollTop =
                window.pageYOffset || document.documentElement.scrollTop;
            if (currentScrollTop > lastScrollTop) {
                setIsHidden(true);
                setIsAtTop(false);
            } else if (currentScrollTop === 0) {
                setIsAtTop(true);
            } else {
                setIsHidden(false);
            }
            lastScrollTop = currentScrollTop;
        };
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const buttonText = location.pathname === "/" ? "Access Notes" : "Homepage";
    const buttonLink = location.pathname === "/" ? "/notes" : "/";

    const handleNotesButtonClicked = () => {
        history(buttonLink);
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }, 500);
    };

    const handleReadingListClick = () => {
        if (location.pathname === "/notes") {
            history("/");
            if(!isReadingListActive) {
                toggleReadingList();
            }
        } else {
            if (isReadingListActive) {
                toggleReadingList();
            } else {
                toggleReadingList();
                setTimeout(() => {
                    const targetElement =
                        document.getElementById("readinglistsection");
                    if (targetElement) {
                        const targetHeight = targetElement.clientHeight;
                        const windowHeight = window.innerHeight;
                        const offset =
                            targetElement.offsetTop -
                            (windowHeight - targetHeight) / 2;
                        window.scrollTo({ top: offset, behavior: "smooth" });
                    }
                }, 50);
            }
        }
    };

    const handleHomeClicked = () => {
        if (isReadingListActive) {
            toggleReadingList();
        }
        history("/");
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }, 500);
    };

    return (
        <header
            className={`fixed top-0 left-0 w-full bg-backgroundPrimary ${
                isHidden
                    ? "transform translate-y-[-80px]"
                    : "px-4 sm:px-8 py-4 border-primary"
            } ${
                isAtTop ? "" : "border-b-2 border-primary shadow-md"
            } transition-all duration-300 ease-in-out z-50`}
        >
            {isAtTop && (
                <div
                    className="absolute w-[40%] sm:w-[30%] border-b-[3px] border-primary"
                    style={{ bottom: "0" }}
                ></div>
            )}
            <div className="flex justify-between items-center">
                <button
                    onClick={handleHomeClicked}
                    className="text-white font-bold text-lg"
                >
                    <img
                        src={Logo}
                        alt="Logo"
                        className={`transition-all duration-300 transform 
                            ${isHidden ? "h-0" : ""}
                            ${!isHidden && !isAtTop ? "h-16" : ""}
                            ${
                                !isHidden && isAtTop
                                    ? "h-32 sm:h-32 max-h-96"
                                    : ""
                            }
                        `}
                    />
                </button>
                <div className="flex flex-col gap-1 sm:gap-2">
                    <div
                        className={`flex gap-1 sm:gap-2 ${
                            !isAtTop ? "flex-row" : "flex-col"
                        } justify-center items-end sm:flex-row`}
                    >
                        <button
                            className="manrope-semibold bg-primary text-white text-[10px] py-[6px] px-[10px] rounded-md sm:px-6 sm:text-[14px] w-24 sm:w-36 sm:rounded-md shadow-lg hover:bg-primaryDark"
                            onClick={handleNotesButtonClicked}
                        >
                            {buttonText}
                        </button>
                        <button
                            className="manrope-semibold bg-primary text-white text-[10px] py-[6px] px-[10px] rounded-md sm:px-6 sm:text-[14px] w-24 sm:w-36 sm:rounded-md shadow-lg hover:bg-primaryDark"
                            onClick={handleReadingListClick}
                        >
                            Reading List
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
