// Two-tone section titles (template style: black + lime last word,
// e.g. "Latest Blogs"). Visual only — text content unchanged.
export default function TwoTone({ text }) {
  const words = String(text).split(' ');
  if (words.length < 2) return <>{text}</>;
  const last = words.pop();
  return <>{words.join(' ')} <span className="hl2">{last}</span></>;
}
