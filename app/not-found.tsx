import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>That address is not part of Finding, Keeping, and Nurturing Clients.</p>
      <p><Link href="/handbook">Back to the handbook</Link></p>
    </>
  );
}
