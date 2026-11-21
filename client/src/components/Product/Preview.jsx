import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import Logo from "../../assets/logos/Logo.png";
import HyperLearning from "../../assets/Preview/HyperLearning.jpg";
import { previewPoints } from './PreviewAndExamples';
import amazonIcon from '../../assets/links/amazon.png';
import perlegoIcon from '../../assets/links/perlego.png';

const Preview = ({ previewOptions, setPreviewOptions }) => {

    return (
        <div className='text-black w-full my-4'>
            <div className='max-w-[1280px] mx-auto'>
                <h1 className='text-left text-primary manrope-semibold text-3xl pt-4'>Page Preview</h1>
                <div className='flex flex-col custmd:flex-row sm:gap-8'>
                    <div className='custlg:w-1/2 flex justify-center custlg:justify-end items-center sm:pt-8'>
                        <div className='bg-footer sm:p-16 rounded-2xl shadow-xl transform scale-90 sm:scale-100'>
                        <div className='bg-white p-6 w-96 shadow-xl border border-gray-200'>
                            <div className='flex flex-col'>
                                <div className='flex gap-5'>
                                    <div className='flex flex-col gap-2'>
                                        <div className='w-16 h-auto mb-4'>
                                            <img src={Logo} alt="Great Read logo" className='h-full w-full object-cover' />
                                        </div>
                                        <div className='w-28 h-auto'>
                                            <img src={HyperLearning} alt="Sample book cover" className='h-full w-full object-cover' />
                                        </div>
                                        { previewOptions.label &&
                                            <div className='text-white manrope-semibold text-[8px] text-center w-full flex flex-col gap-1'>
                                                <div className='bg-orange-600 p-1 rounded-md'>
                                                    <p>Breaking Your Limits</p>
                                                </div>
                                                <div className='bg-blue-600 p-1 rounded-md'>
                                                    <p>Innovation and Creativity</p>
                                                </div>
                                            </div>
                                        }
                                        { previewOptions.links &&
                                            <div className="flex space-x-2 px-2 justify-center items-center">
                                                <img
                                                    src={amazonIcon}
                                                    alt="Amazon"
                                                    className="w-1/2 h-auto cursor-pointer"
                                                />
                                                <img
                                                    src={perlegoIcon}
                                                    alt="Perlego"
                                                    className="w-1/2 h-auto cursor-pointer"
                                                />
                                            </div>
                                        }
                                    </div>
                                    <div>
                                        <div className='manrope-semibold text-[8px] text-white bg-primary text-center'>HIGHLIGHTS</div>
                                        <ul className='list-disc text-[6.5px] py-1'>
                                            { previewPoints.map((point, index) => (
                                                <li key={index} className='my-1'>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className='pb-16'>
                                    <div className={` ${previewOptions.notes ? 'visible' : 'invisible'} manrope-semibold text-[8px] text-white bg-primary text-center`}>NOTES</div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    <div className='flex flex-col justify-center items-start'>
                        <p className='text-xl my-2 manrope-semibold'>Personalize your Notes to include:</p>
                        <FormGroup>
                            <FormControlLabel 
                                control={<Checkbox checked={previewOptions.notes} onChange={() => setPreviewOptions(prevState => ({ ...prevState, notes: !prevState.notes }))} />} 
                                label="Space to add your thoughts, ideas or comments" 
                            />
                            <FormControlLabel 
                                control={<Checkbox checked={previewOptions.links} onChange={() => setPreviewOptions(prevState => ({ ...prevState, links: !prevState.links }))} />} 
                                label="Amazon and Perlego Links"
                            />
                            <FormControlLabel 
                                control={<Checkbox checked={previewOptions.label} onChange={() => setPreviewOptions(prevState => ({ ...prevState, label: !prevState.label }))} />} 
                                label="Category label"
                            />
                        </FormGroup>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Preview