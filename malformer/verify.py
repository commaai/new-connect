from utils.defaults import FPS
from utils.reader import LogFileReader
from concurrent.futures import ThreadPoolExecutor
import os, threading

class Verifier:
    def __init__(self, paths):
        self.qlogs = paths['qlogs']
        self.qcams = paths['qcameras']
        self.status = None
    
    def _verify_qlogs(self, messages):
        i = 0
        for message in messages:
            if message.which() == 'qRoadEncodeIdx':
                i += 1
        return i/60 == FPS
    
    def _verify_qcams(self, path):
        return os.path.exists(path)

    def _verify_start_segment(self, messages, index):
        if index > 0: return True

        for message in messages:
            if message.which() == 'qRoadEncodeIdx':
                return message.qRoadEncodeIdx.segmentNum == 0
    
    def __str__(self):
        if self.status is None:
            return "Segments haven't been verified yet. Run Verifier.verify() to get verification results."
        
        result = []
        for segment in self.status:
            result.append(f"Route segment {segment['segment']}")
            issues = [msg for key, msg in segment.items() if key != 'segment' and msg]
            result.extend(issues if issues else ["Segment seems good."])
        
        return "\n".join(result)

    def verify(self):
        segments = []

        def _verify_route(qlog, qcam, index):
            messages = LogFileReader(qlog)
            return {
                'segment': index,
                'start_segment': False if self._verify_start_segment(messages, index) else 'segment doesnt start at index 0',
                'qlogs': False if self._verify_qlogs(messages) else 'segment length may not be exactly 60s', 
                'qcameras': False if self._verify_qcams(qcam) else 'qcamera.ts wasnt found for this segment' 
            }
        
        with ThreadPoolExecutor() as executor:
            futures = [executor.submit(_verify_route, qlog, self.qcams[i], i) for i, qlog in enumerate(self.qlogs)]
            for future in futures:
                segments.append(future.result())
        
        segments = sorted(segments, key=lambda d: d['segment'])
        self.status = segments
        return segments
    