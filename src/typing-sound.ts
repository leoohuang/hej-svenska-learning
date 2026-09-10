export type TypingSoundProfile = 'clicky' | 'tactile' | 'soft'

let journeyAudioContext: AudioContext | null = null

export function playTypingSound(type: 'key' | 'wrong' | 'complete', profile: TypingSoundProfile) {
  try {
    const AudioContextConstructor = window.AudioContext
      || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    journeyAudioContext ||= new AudioContextConstructor()
    const context = journeyAudioContext
    if (context.state === 'suspended') void context.resume()
    const now = context.currentTime

    if (type === 'complete') {
      ;[659.25, 987.77].forEach((frequency, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const start = now + index * .065
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, start)
        gain.gain.setValueAtTime(.0001, start)
        gain.gain.exponentialRampToValueAtTime(.055, start + .008)
        gain.gain.exponentialRampToValueAtTime(.0001, start + .25)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(start)
        oscillator.stop(start + .27)
      })
      return
    }

    if (type === 'wrong') {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(128, now)
      oscillator.frequency.exponentialRampToValueAtTime(92, now + .09)
      gain.gain.setValueAtTime(.045, now)
      gain.gain.exponentialRampToValueAtTime(.0001, now + .1)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + .105)
      return
    }

    const settings = {
      clicky: { frequency: 1360, body: 410, volume: .036 },
      tactile: { frequency: 980, body: 340, volume: .032 },
      soft: { frequency: 720, body: 270, volume: .018 },
    }[profile]
    const click = context.createOscillator()
    const clickGain = context.createGain()
    click.type = 'triangle'
    click.frequency.setValueAtTime(settings.frequency, now)
    click.frequency.exponentialRampToValueAtTime(settings.body, now + .032)
    clickGain.gain.setValueAtTime(settings.volume, now)
    clickGain.gain.exponentialRampToValueAtTime(.0001, now + .036)
    click.connect(clickGain)
    clickGain.connect(context.destination)
    click.start(now)
    click.stop(now + .04)
  } catch {
    // Keyboard sound is optional when Web Audio is unavailable.
  }
}
