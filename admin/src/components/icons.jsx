const base = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false,
};

const make = (d) =>
    function Icon({ size = 20, className }) {
        return (
            <svg {...base} width={size} height={size} className={className}>
                {d}
            </svg>
        );
    };

export const HomeIcon = make(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>);
export const BookIcon = make(<><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" /><path d="M4 19V5" /><path d="M9 7h6" /></>);
export const TagIcon = make(<><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1" /></>);
export const StarIcon = make(<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />);
export const PlusIcon = make(<><path d="M12 5v14" /><path d="M5 12h14" /></>);
export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>);
export const EditIcon = make(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>);
export const TrashIcon = make(<><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>);
export const CloseIcon = make(<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>);
export const MenuIcon = make(<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>);
export const EyeIcon = make(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>);
export const EyeOffIcon = make(<><path d="M3 3l18 18" /><path d="M10.6 5.1A9.7 9.7 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.6 6.6A17 17 0 002 12s4 7 10 7a9.6 9.6 0 004.4-1" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></>);
export const UpIcon = make(<path d="M6 15l6-6 6 6" />);
export const DownIcon = make(<path d="M6 9l6 6 6-6" />);
export const ImageIcon = make(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></>);
export const LogoutIcon = make(<><path d="M9 4H5v16h4" /><path d="M16 8l4 4-4 4" /><path d="M20 12H9" /></>);
export const CheckIcon = make(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const AlertIcon = make(<><path d="M12 3l10 18H2z" /><path d="M12 10v5" /><path d="M12 18h.01" /></>);
export const ArrowLeftIcon = make(<><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></>);
