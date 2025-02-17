import { useEffect } from 'react';

interface SignASLEmbedProps {
  vidref: string;
  title: string;
}

export default function SignASLEmbed({ vidref, title }: SignASLEmbedProps) {
  useEffect(() => {
    // Load the SignASL embed script
    const script = document.createElement('script');
    script.src = 'https://embed.signasl.org/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="sign-asl-embed">
      <blockquote className="signasldata-embed" data-vidref={vidref}>
        <a href={`https://www.signasl.org/sign/${title.toLowerCase()}`}>
          Watch how to sign '{title}' in American Sign Language
        </a>
      </blockquote>
    </div>
  );
}
