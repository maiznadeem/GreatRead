
const Step1 = ({ name, handleNameChange }) => {
    return (
        <div className="step-content">
            <div className='flex flex-col items-center gap-4 py-4 sm:py-8'>
                <p className='text-black text-center text-xl sm:text-2xl manrope-semibold'>{ name.trim() !== "" ? `Hi, ${name}` : "Create your reading goal"}</p>
                <input
                    type="text"
                    className='bg-white border-gray-400 border sm:py-2 sm:px-4 px-3 py-2 w-[80%] sm:w-[70%] max-w-[400px] text-md sm:text-md manrope-regular text-black rounded-md focus:outline-hidden focus:ring-2 focus:ring-primary/50'
                    placeholder='Enter your name...'
                    onChange={handleNameChange}
                />
                <p className='text-black text-center text-sm sm:text-md manrope-regular max-w-[500px]'>You will be able to download it as a PDF and/or share it on your LinkedIn.</p>
            </div>
        </div>
    )
}

export default Step1