import { Skeleton } from "@mui/material";
import { useState } from "react";
import { motion } from "motion/react";

function TopPickCard({ book }) {

    const [show, setShown] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    return (
        <motion.div
            animate={{
                scale: show ? 1.03 : 1,
                boxShadow: show
                    ? "0 20px 25px rgb(0 0 0 / 25%)"
                    : "0 2px 10px rgb(0 0 0 / 8%)",
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{
                display: 'flex',
                justifyContent: 'center',
                width: '160px',
                height: '260px',
                overflow: "hidden",
                borderRadius: '12px',
            }}
            onMouseEnter={() => setShown(true)}
            onMouseLeave={() => setShown(false)}
        >
            { !isImageLoaded && <Skeleton variant="rectangular" width={170} height={270} className='absolute inset-0' sx={{ bgcolor: '#f0f0f0' }} animation="wave" /> }
            <img
                src={book.image}
                alt={book.title}
                style={{ objectFit: "cover" }}
                onLoad={() => setIsImageLoaded(true)}
            />
        </motion.div>
    );
}

export default TopPickCard;
