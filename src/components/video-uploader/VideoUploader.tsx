import { ChangeEventHandler, useEffect, useState } from "react";
import { CAPTIONS_GENERATION_COMPLETED, GENERATE_SUBTITLES_TASK, dispatchCustomEvent } from "../../utils/ai-tools";

/*
*   1. call GENERATE_SUBTITLES_TASK - done
*   2. listen to event CAPTIONS_GENERATION_COMPLETED mad clean once return - done
*   3. parse the response -done
*   4. hold the data in array of objects - done
*   5. once I have the data, display the video - done
*   6. listen to video update ... -> find the text that match the time > from time and < from the next - done
*   7. display the text on top of the video - done
*/
function timeStrToInt(timestamp: string): any {
    const temp = timestamp.split(':');
    return parseInt(temp[0])*3600 + parseInt(temp[1])*60 + parseInt(temp[2])
}

function VideoUploader() {
    const [videoSrc, setVideoSrc] = useState<string>();
    const [videoSubtitleArr, setVideoSubtitleArr] = useState<{timestamp:any, text:any}[]>([]);
    const [currentSubtitle, setCurrentSubtitle] = useState('');

    const parseEventResponse = (event:any) =>{
        let subStringObjArray:{timestamp:any, text:any}[] = [];
        const suntitleArray:[any] = event.detail.response.split('\n');
        suntitleArray.forEach(element => {
            const [timestamp, ...text]   = element.split(' ');
            const subStringObj = {timestamp, text:text.join(' ')};
            subStringObj.timestamp = timeStrToInt(subStringObj.timestamp);
            if (!Number.isNaN(subStringObj.timestamp)) subStringObjArray.push(subStringObj);
        });
        setVideoSubtitleArr(subStringObjArray);
    }

    useEffect(()=>{
        document.addEventListener(CAPTIONS_GENERATION_COMPLETED, parseEventResponse);
        return(()=>{
            document.removeEventListener(CAPTIONS_GENERATION_COMPLETED, parseEventResponse);
        })
    },[])
    

    const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = (e) => {
            if (!e.target) return
            setVideoSrc(e.target.result as string);
            dispatchCustomEvent(GENERATE_SUBTITLES_TASK, {
                detail: {
                  videoSrc
                }
            })
        };

        reader.readAsDataURL(file);
    };

    const handleCurrentTime = (time: number) => {
        let subtitle: { timestamp: number, text: string } | undefined;
    
        for (let i = 0 ; i < videoSubtitleArr.length ; i++) {
            const startTime = videoSubtitleArr[i].timestamp;
            const nextSubtitle = videoSubtitleArr[i + 1];
            const endTime = nextSubtitle ? nextSubtitle.timestamp : Number.POSITIVE_INFINITY;
    
            if (time >= startTime && time < endTime) {
                subtitle = videoSubtitleArr[i];
                break;
            }
        }
    
        if (subtitle) {
            setCurrentSubtitle(subtitle.text);
        } else {
            setCurrentSubtitle('');

        }
    };
    

    return (
            <div>
                {!videoSrc && <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                />}
                {videoSubtitleArr.length > 0 && 
                <div style={{position:'relative', display: "inline-block"}}>
                        <video 
                            src={videoSrc} 
                            controls
                            height='400px'
                            onTimeUpdate={(event:any)=>{
                                handleCurrentTime(event.target.currentTime);
                            }}
                            
                        />
                        <p style={{ 
                            position:"absolute",
                            bottom:'20px',
                            left:'50%',
                            transform: 'translateX(-50%)',   
                            color:"white"
                        }}>{currentSubtitle}</p>
                </div>
                }
                
            </div>
    );
}

export default VideoUploader;


