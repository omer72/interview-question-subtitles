import { ChangeEventHandler, useEffect, useState } from "react"; 
import { CAPTIONS_GENERATION_COMPLETED, GENERATE_SUBTITLES_TASK, dispatchCustomEvent } from "../../utils/ai-tools";
import { timeStamp } from "console";

/*
* 1. dispatch event - done
* 2. listen to event - done
* 3. parse response - done
* 4. store reponse - [{timestamp:number, text:string}] - done
* 5. display <video> - done
* 6. get update time from video - done
* 7. get text fron array timestamp >= time && timestamp +1 < time - done
* 8. display the text on top of the video - use position - done
*/

function convertTexttoTime(timeStamp:string){
    // get 00:00:01 and return second
    const timeStampArr = timeStamp.split(':');
    return parseInt(timeStampArr[0])*3600 + parseInt(timeStampArr[1])*60 + parseInt(timeStampArr[2])
}
function VideoUploader() {
    const [videoSrc, setVideoSrc] = useState<string>();
    const [captionArr, setCaptionArr] = useState<{timeStamp:number, text:string}[]>([]);
    const [captionText, setCaptionText] = useState('');
    
    
    const parseCaption = (event:any) =>{
        let captionArr = [];
        const captionArray = event.detail.response.split('\n');
        for (const caption of captionArray) {
            let [timestamp,...text] = caption.split(' ');
            if (timestamp.length > 0){
                const captionObj = {timeStamp: convertTexttoTime(timestamp), text: text.join(' ')}
                setCaptionArr(prev => [...prev, captionObj]);
            }
        }
    }

    useEffect(() => {
        document.addEventListener(CAPTIONS_GENERATION_COMPLETED, parseCaption);
        return (()=>{
            document.removeEventListener(CAPTIONS_GENERATION_COMPLETED,parseCaption);
        })
    },[])

    const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = (e) => {
            if (!e.target) return
            const videoUrl = e.target.result as string
            setVideoSrc(videoUrl);
            dispatchCustomEvent(GENERATE_SUBTITLES_TASK, { detail : videoUrl });

        };

        reader.readAsDataURL(file);
    };

    const updateCation = (event:any) => {
        const currentTime = parseInt(event.target.currentTime);
        for (let index = 0; index < captionArr.length; index++) {
            const captionTime = captionArr[index].timeStamp;
            const nextCaptionTime = captionArr[index+1];
            const endTime = nextCaptionTime ? nextCaptionTime.timeStamp : Number.POSITIVE_INFINITY
            if (currentTime >= captionTime && currentTime < endTime){
                setCaptionText(captionArr[index].text);
                break;
            }
        }
    }

    return (
            <div>
                {!videoSrc && <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                />}
                {videoSrc && captionArr.length === 0 && <h4>Loading....</h4>}
                {captionArr.length > 0 && 
                     <div style={{position:'relative', display: "inline-block"}}>
                    <video src={videoSrc} controls style={{ height: '400px', width: '600px' }} onTimeUpdate={updateCation} />
                    <div style={{ position:"absolute",
                            bottom:'60px',
                            left:'50%',
                            transform: 'translateX(-50%)',   
                            color:"white" }}>{captionText}</div>
                </div>
                }
            </div>
    );
}

export default VideoUploader;
