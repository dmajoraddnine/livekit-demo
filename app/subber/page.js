'use client';

import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import '@livekit/components-styles';

import { createEchoDelayEffect } from '../../lib/audio.js';

import ConnectionStatus from '../../components/ConnectionStatus.js';

const serverUrl = 'wss://favorited-test-7e5e76k4.livekit.cloud';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTc0MzY5MjgsImlkZW50aXR5IjoiZG1ham9yYWRkbmluZTIiLCJpc3MiOiJBUEkzTEVBS0Z0TXhRSlciLCJuYW1lIjoiZG1ham9yYWRkbmluZTIiLCJuYmYiOjE3NTczNTA1MjgsInN1YiI6ImRtYWpvcmFkZG5pbmUyIiwidmlkZW8iOnsicm9vbSI6IlRoZUdhcmRlbiIsInJvb21Kb2luIjp0cnVlfX0.UjKvmwaiy7qFHRU8uCE15mRWyGgrfDGs44cLUfwvgUk';

// record screen & source code

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const [audioContext, setAudioContext] = useState(null);
  const [delayOutput, setDelayOutput] = useState(null);

  const [videoTracksSubbed, setVideoTracksSubbed] = useState({});
  const [audioTracksSubbed, setAudioTracksSubbed] = useState({});
  const [delayHandles, setDelayHandles] = useState([]);
  const [delayValues, setDelayValues] = useState([]);

  const [vidIsMirrored, setVidIsMirrored] = useState(false);

  const [room] = useState(() => new Room({
    adaptiveStream: true, // Optimize video quality for each participant's screen
    dynacast: true,       // Enable automatic audio/video quality optimization
  }));

  useEffect(() => {
    if (room) {
      listenToRoomEvents();
    }

    return () => {
      stopListeningToRoomEvents();
    }
  }, [room]);

  function listenToRoomEvents() {
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
  }

  function stopListeningToRoomEvents() {
    room.removeListener(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.removeListener(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
  }

  useEffect(() => {
    // actually wait for connect API, after connection initiated
    // - IIFE here to make React linter happy
    (async () => {
      if (connectionStatus === 'connecting') {
        await room.connect(serverUrl, token);
        setConnectionStatus('connected');
      }
    })();

    // after we are connected, initialize the audio context & delay output (only the first time)
    if (connectionStatus === 'connected' && !audioContext) {
      const newContext = new AudioContext();
      const newOutput = newContext.createGain();
      newOutput.gain.value = 1;
      newOutput.connect(newContext.destination);
      setAudioContext(newContext);
      setDelayOutput(newOutput);
    }
  }, [connectionStatus]);

  async function initiateConnection() {
    if (room && (connectionStatus === 'disconnected')) {
      setConnectionStatus('connecting');
    }
  }

  async function disconnect() {
    await room?.disconnect();
    setConnectionStatus('disconnected');
  }

  function handleJoinLeaveClick() {
    if (connectionStatus === 'connected') {
      disconnect();
    } else if (connectionStatus === 'disconnected') {
      initiateConnection();
    }
  }

  function handleTrackSubscribed(track, publication, participant) {
    const element = track.attach(); // this plays the track!

    function updatePrev(p) {
      const n = { ...p };
      n[track.sid] = track;
      return n;
    }

    if (track.kind === 'video') {
      videoRef.current.appendChild(element);
      setVideoTracksSubbed(updatePrev);
    }

    if (track.kind === 'audio') {
      setAudioTracksSubbed(updatePrev);
    }
  }

  function handleTrackUnsubscribed(track, publication, participant) {
    track.detach();

    while (videoRef.current.firstChild) {
      videoRef.current.removeChild(videoRef.current.firstChild);
    }

    function deletePrev(p) {
      const n = { ...p };
      delete n[track.sid];
      return n;
    }

    if (track.kind === 'video') {
      setVideoTracksSubbed(deletePrev);
    }

    if (track.kind === 'audio') {
      setAudioTracksSubbed(deletePrev);
    }
  }

  function handleFlipClick(e) {
    setVidIsMirrored(!vidIsMirrored);
  }

  function handleAddDelayClick(e) {
    const tracks = Object.values(audioTracksSubbed) || [];
    if (!tracks.length) {
      return;
    }

    // add a new echoDelay output to audio context
    const newSource = audioContext.createMediaStreamSource(tracks[0].mediaStream);
    const newEchoDelay = createEchoDelayEffect(audioContext);
    newEchoDelay.placeBetween(newSource, delayOutput);
    newEchoDelay.apply();

    setDelayHandles((prevHandles) => {
      const newHandles = [...prevHandles, newEchoDelay];
      return newHandles;
    });
    setDelayValues((prevValues) => ([...prevValues, 1]));
  }

  function handleStopDelayClick(e, i) {
    if (i === undefined) {
      for (let h of delayHandles) {
        h.discard();
      }
      setDelayHandles([]);
      setDelayValues([]);
    } else {
      const h = delayHandles.at(i);
      h.discard();
      setDelayHandles((prevHandles) => prevHandles.filter((ph, j) => (j !== i)));
      setDelayValues((prevValues) => prevValues.filter((pv, j) => (j !== i)));
    }
  }

  const hasAudioTracksSubbed = !!Object.values(audioTracksSubbed).length;

  return (
    <div
      id="app-container"
      data-lk-theme="default"
    >
      <div className="center-section">
        <h1>Subber</h1>

        <div className="vid-container">
          <div
            id="video-elements"
            className={ `${vidIsMirrored ? 'flip' : '' }` }
            ref={ videoRef }
          ></div>
          <div
            id="audio-elements"
            ref={ audioRef }
          ></div>

          <div className="controls-wrapper">
            {
              connectionStatus === 'connected' &&
              <>
                {
                  hasAudioTracksSubbed &&
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                    <span style={{ color: '#111', paddingBottom: '12px', fontSize: '32px', fontWeight: 'bold' }}>
                      Baby's First Delay Pedal
                    </span>
                    <div style={{ display: 'flex' }}>
                      <button onClick={ handleAddDelayClick }>
                        Add Delay
                      </button>
                      <button
                        disabled={ !delayHandles.length }
                        onClick={ handleStopDelayClick }
                      >
                        Kill Delays
                      </button>
                    </div>
                  </div>
                }
                <div className="delay-sliders-wrapper">
                  {
                    delayHandles.map((h, i) => (
                      <div
                        key={ `delay-slider-${ i }`}
                        className="slider"
                      >
                        <div className="label">
                          { `Vol: ${ (delayValues[i] * 100).toFixed(0) }` }
                        </div>
                        <input
                          type="range"
                          name={ `delay-handle-${ i }`}
                          min="0"
                          max="1"
                          value={ delayValues[i] }
                          step="0.0001"
                          onChange={ (e) => {
                            h.volume(e.target.value);
                            setDelayValues((prevValues) => {
                              const newValues = [...prevValues];
                              newValues[i] = e.target.value;
                              return newValues;
                            });
                          } }
                        />
                        <button
                          className="xs"
                          onClick={ (e) => { handleStopDelayClick(e, i); } }
                        >
                          X
                        </button>
                      </div>
                    ))
                  }
                </div>
              </>
            }
          </div>

        </div>

        <div className="controls-wrapper bottom">
          <button
            disabled={ connectionStatus === 'connecting' }
            onClick={ handleJoinLeaveClick }
          >
            { connectionStatus === 'connected' ? 'Leave Room' : 'Join Room' }
          </button>

          {
            connectionStatus === 'connected' &&
            !!Object.values(videoTracksSubbed).length &&
            <>
              <button onClick={ handleFlipClick }>
                Go Flip Yourself
              </button>
            </>
          }
        </div>
      </div>

      <ConnectionStatus
        status={ connectionStatus }
        roomName={ room.name }
      />
    </div>
  );
}
