import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Assume req will take in imageName in req.params
const getImageUrl = (s3Client, s3BuckeName, s3ExpireSecs) => {
  return async (req, res) => {
    console.log('Image requested = ', req.params.imageName);
    const fetchCommand = new GetObjectCommand({
      Bucket: s3BuckeName,
      Key: req.params.imageName,
    });
  
    try {
      const signedUrl = await getSignedUrl(s3Client, fetchCommand, {
        expiresIn: s3ExpireSecs,
      });
      console.log('Signed URL: ', signedUrl);
      res.type('text').send(signedUrl);
    } catch (error) {
      console.error('Error generating signed URL:', error);
      res.status(500).json({ error: 'Failed to generate signed URL' });
    }
  };
}

export default getImageUrl;
