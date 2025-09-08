A demonstration of [LiveKit WebRTC framework](https://livekit.io), using NextJS and ReactJS.

Contains simple publish and subscribe functionality using hardcoded LiveKit room and identities. 
Also includes a simple client-based delay-pedal feature using the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API).

Areas for improvement/TODO:
- generate auth token on page load instead of hardcoding
- support for multiple concurrent subber tabs (need a different identity & auth token per tab)
- other types of signal-processing effects (chorus, pitch shifter)
- publish mixed-down subber output back to room, so others can subscribe to processed output
- record mixed-down subber output and export to local disk or LiveKit room
