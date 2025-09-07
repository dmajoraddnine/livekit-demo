'use client';

import { useState, useEffect } from 'react';
import { Room, Track } from 'livekit-client';
import '@livekit/components-styles';

import ConnectionStatus from '../../components/ConnectionStatus.js';

const serverUrl = 'wss://favorited-test-7e5e76k4.livekit.cloud';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTczNTI3MDgsImlkZW50aXR5IjoiZG1ham9yYWRkbmluZSIsImlzcyI6IkFQSTNMRUFLRnRNeFFKVyIsIm5hbWUiOiJkbWFqb3JhZGRuaW5lIiwibmJmIjoxNzU3MjY2MzA4LCJzdWIiOiJkbWFqb3JhZGRuaW5lIiwidmlkZW8iOnsicm9vbSI6IlRoZUdhcmRlbiIsInJvb21Kb2luIjp0cnVlfX0.L04hG5u6nZXD2_6Kk9kiTU6nsLxWI3X45rbZXJt9jno';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'

  const [isPublished, setIsPublished] = useState(false);

  const [room] = useState(() => new Room({
    adaptiveStream: true, // Optimize video quality for each participant's screen
    dynacast: true,       // Enable automatic audio/video quality optimization
  }));

  async function initiateConnection() {
    if (room && (connectionStatus === 'disconnected')) {
      setConnectionStatus('connecting');
    }
  }

  // - use IIFE here to make React linter happy
  useEffect(() => {
    (async () => {
      if (connectionStatus === 'connecting') {
        await room.connect(serverUrl, token);
        setConnectionStatus('connected');
      }

      if (connectionStatus === 'connected') {
        await room.localParticipant.enableCameraAndMicrophone();
        setIsPublished(true);
      }
    })();
  }, [connectionStatus]);

  async function disconnect() {
    if (!room) {
      return;
    }

    // unpublish local tracks
    for (let [trackID, p] of room.localParticipant.trackPublications) {
      room.localParticipant.unpublishTrack(p.track, true);
    }

    await room.disconnect();

    setIsPublished(false);

    setConnectionStatus('disconnected');
  }

  function handleJoinLeaveClick() {
    if (connectionStatus === 'connected') {
      disconnect();
    } else if (connectionStatus === 'disconnected') {
      initiateConnection();
    }
  }

  return (
    <div
      id="app-container"
      data-lk-theme="default"
    >
      <div className="center-section">
        <h1>Pubber</h1>

        <div className={ `publish-status ${ isPublished ? 'published' : '' }` }>
          {
            `You are ${ !isPublished ? 'not ' : '' } live${ isPublished ? '!' : '.' }`
          }
        </div>

        <div className="controls-wrapper">
          <button
            disabled={ connectionStatus === 'connecting' }
            onClick={ handleJoinLeaveClick }
          >
            { connectionStatus === 'connected' ? 'Leave Room' : 'Join Room and Publish' }
          </button>
        </div>
      </div>

      <ConnectionStatus
        status={ connectionStatus }
        roomName={ room.name }
      />
    </div>
  );
}
