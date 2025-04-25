import { NFTStorage, File } from 'nft.storage';

// 🔑 Replace with your actual NFT.Storage API key
const NFT_STORAGE_TOKEN = 'YOUR_NFT_STORAGE_API_KEY';

const getCoverImageUrl = async (title: string): Promise<string> => {
  const formattedTitle = encodeURIComponent(title);
  return `https://covers.openlibrary.org/b/title/${formattedTitle}-L.jpg`;
};

export const uploadMetadataToIPFS = async (
  title: string,
  author: string,
  description: string
): Promise<string> => {
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

  const coverImageUrl = await getCoverImageUrl(title);
  const response = await fetch(coverImageUrl);
  if (!response.ok) throw new Error('Failed to fetch cover image from Open Library');

  const blob = await response.blob();
  const file = new File([blob], `${title.replace(/\s+/g, '_')}-cover.jpg`, { type: blob.type });

  const metadata = await client.store({
    name: title,
    description,
    image: file,
    properties: {
      author,
    },
  });

  return metadata.ipnft;
};
