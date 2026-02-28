/**
 * SEO Component
 * Handles meta tags, OpenGraph, and Twitter cards for all pages.
 * 
 * Usage:
 *   <SEO 
 *     title="Page Title"
 *     description="Page description for search engines and social sharing"
 *     path="/about"
 *     image="/images/about-preview.jpg"  // optional, falls back to default
 *   />
 */

import { Helmet } from 'react-helmet-async';

// Defaults from environment
const SITE_NAME = 'Skeleton Key';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://skeletonkey-fe.vercel.app';
const DEFAULT_IMAGE = import.meta.env.VITE_OG_IMAGE_DEFAULT || `${SITE_URL}/og-default.png`;
const TWITTER_HANDLE = import.meta.env.VITE_TWITTER_HANDLE || '';

export default function SEO({
  title,
  description = 'Production-ready full-stack starter kit with React, Express, MongoDB, and Auth0.',
  path = '',
  image,
  type = 'website',
  noIndex = false,
}) {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
  const url = `${SITE_URL}${path}`;
  const imageUrl = image 
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : DEFAULT_IMAGE;

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* OpenGraph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {TWITTER_HANDLE && <meta name="twitter:site" content={TWITTER_HANDLE} />}

      {/* Canonical */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
