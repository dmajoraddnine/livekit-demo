export default function ConnectionStatus({ status, roomName }) {
  if (!status) {
    return null;
  }

  const isConnected = (status === 'connected');
  const isConnecting = (status === 'connecting');

  return (
    <div className={ `connection-status ${ status.toLowerCase() || '' }` }>
      {
        `${ status }${ isConnecting ? '...' : '' }${ isConnected ? (' to ' + roomName) : '' }`
      }
    </div>
  );
}
