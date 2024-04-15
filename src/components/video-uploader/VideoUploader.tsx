import { ChangeEventHandler, useEffect, useState } from "react";

 
import { CAPTIONS_GENERATION_COMPLETED, GENERATE_SUBTITLES_TASK, dispatchCustomEvent } from "../../utils/ai-tools";
import { text } from "stream/consumers";

interface Subtitle{
    time:number,
    text:string
}

function VideoUploader() {
    const [videoSrc, setVideoSrc] = useState<string>();
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [subtitleText, setSubtitleText] = useState('');

    useEffect(()=>{
        
        const handleSubstr  = (substr:any) => {
            let subTitleObj:Subtitle[] = [];
            const subStrArr = substr.detail.response.split('\n');
            for (let index = 0; index < subStrArr.length; index++) {
                const element = subStrArr[index];
                const time  = element.slice(0,8).split(':');
                const hour = time[0];
                const min = time[1];
                const sec = time[2];
                const secTotal = hour * 3600 +  min * 60 + sec;
                subTitleObj.push({time: secTotal, text: element.slice(9)})
            };
            setSubtitles(subTitleObj);
        }
        document.addEventListener(CAPTIONS_GENERATION_COMPLETED,handleSubstr);
        
        return(() =>
            document.removeEventListener(CAPTIONS_GENERATION_COMPLETED,handleSubstr)
        )


    },[])
   
    const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = (e) => {
            if (!e.target) return
            const videoSrc = e.target.result as string;
            setVideoSrc(videoSrc);
            dispatchCustomEvent(GENERATE_SUBTITLES_TASK,{
                detail: {
                    videoSrc
                  }
            })
        };

        reader.readAsDataURL(file);
    };

    const handleTimeChange = (time:number) => {
        const subtitle = subtitles.find(sub => {
            const startTime = sub.time;
            const nextSubtitleIndex = subtitles.indexOf(sub) + 1;
            const endTime = nextSubtitleIndex < subtitles.length ? subtitles[nextSubtitleIndex].time : Number.POSITIVE_INFINITY;
            return time >= startTime && time < endTime;
        });
    
        if (subtitle) {
            setSubtitleText(subtitle.text);
        } else {
            console.error("No subtitle found for the given time.");
        }
    }


    return (
            <div>
                {!videoSrc && <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                />}
                {subtitles.length > 0 &&  <div   
                style={{ display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                  }}>
                    <div style={{position:'relative'}}> 
                        <video src={videoSrc} style={{ maxWidth: '100%', maxHeight: '100%' }} controls  height='400px' onTimeUpdate={(event:any) =>{
                            handleTimeChange(parseInt(event.target.currentTime) ) 
                        }} />
                        <p style={{ position: 'absolute', 
                        bottom: 40, left: 0, width: '100%', 
                        textAlign: 'center',  color: '#fff', padding: '5px' }}>{subtitleText}</p>
                    </div>
                </div>}

            </div>
    );
}

export default VideoUploader;
