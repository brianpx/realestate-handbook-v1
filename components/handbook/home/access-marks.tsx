// The only two marks the free reader sees on the handbook home: a text pill on what is open, hidden text on what is
// not. There is no padlock and nothing here relies on colour alone.
export function FreePill() {
  return <span className="hb-home-pill">Free</span>;
}

export function MembersOnlyText() {
  return <span className="visually-hidden"> (members only)</span>;
}
