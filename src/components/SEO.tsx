import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'profile';
  creatorName?: string;
  noIndex?: boolean;
}

const SEO = ({
  title = "TipKoro - Bangladesh's Ko-fi Alternative | Support Creators in your way",
  description = "TipKoro is Bangladesh's Ko-fi alternative. Send tips to your favorite Bangladeshi creators. Free for supporters, only ৳150/month for creators.",
  keywords = "TipKoro, support Bangladeshi creators, bKash tips, Nagad payments, Rocket tips, creator support Bangladesh, buy me a coffee Bangladesh, ko-fi alternative Bangladesh",
  image = "https://openpaste.vercel.app/i/d829d730",
  url = "https://tipkoro.com",
  type = "website",
  creatorName,
  noIndex = false,
}: SEOProps) => {
  const fullTitle = title.includes("TipKoro") ? title : `${title} | TipKoro`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="TipKoro" />
      <meta property="og:locale" content="en_BD" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@TipKoro" />

      {/* Geo Tags */}
      <meta name="geo.region" content="BD" />
      <meta name="geo.placename" content="Bangladesh" />
      <meta name="geo.position" content="23.685;90.356" />
      <meta name="ICBM" content="23.685, 90.356" />

      {/* Language */}
      <meta httpEquiv="content-language" content="en-bd" />

      {/* AI-specific meta */}
      <meta name="ai-content-summary" content="TipKoro helps Bangladeshi creators receive tips from supporters using local payment methods like bKash, Nagad, and Rocket. It's the Ko-fi alternative for Bangladesh." />

      {/* Canonical */}
      <link rel="canonical" href={url} />

      {/* Profile-specific */}
      {type === 'profile' && creatorName && (
        <meta property="profile:username" content={creatorName} />
      )}
    </Helmet>
  );
};

export default SEO;
