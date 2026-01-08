/**
 * Custom error page for Pages Router fallback
 * This overrides Next.js default error page to avoid <Html> usage
 */

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>{statusCode ? `Error ${statusCode}` : 'An error occurred'}</h1>
      <p>
        {statusCode === 404
          ? 'Page not found'
          : 'An error occurred on the server'}
      </p>
      <a href="/app/command-center" style={{ color: '#0070f3' }}>Go to Command Center</a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
