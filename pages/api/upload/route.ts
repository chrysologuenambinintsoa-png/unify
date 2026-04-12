import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Note: `export const config` with `maxDuration` is deprecated for app routes
// and cannot be statically parsed by Next.js. If you need longer timeouts
// for uploads, handle them in a server runtime (custom server), configure
// them in your deployment platform, or implement streaming/uploads that
// avoid long-running serverless executions.

export async function POST(req: NextRequest) {
  try {
    let session = null;
    // TODO: Implement proper session handling
    // let session;
    // try {
    //   session = await getServerSession(authOptions);
    // } catch (err) {
    //   console.error('Failed to get session:', err instanceof Error ? err.message : String(err));
    //   session = null;
    // }
    console.log('Upload request - Session:', session?.user?.id ? 'Authenticated' : 'Not authenticated');

    if (!session?.user?.id) {
      console.warn('Upload request without authentication');
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          errorCode: 'UNAUTHORIZED',
          message: 'You must be logged in to upload files'
        },
        { status: 401 }
      );
    }

    let formData;
    try {
      formData = await req.formData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid form data';
      console.error('Error parsing form data:', errorMsg);
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          errorCode: 'INVALID_FORMAT',
          message: errorMsg
        },
        { status: 400 }
      );
    }

    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as string;

    console.log('Upload request:', {
      filesCount: files.length,
      type,
      fileTypes: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });

    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          error: 'No files provided',
          errorCode: 'NO_FILES',
          message: 'Please select at least one file to upload'
        },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { 
          error: 'Upload type not specified',
          errorCode: 'NO_TYPE',
          message: 'File type (image or video) must be specified'
        },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];
    const errors: Array<{ file: string; message: string }> = [];

    console.log(`Processing ${files.length} files for upload...`);
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}`);
        // Validate file
        if (!file || !(file instanceof File)) {
          errors.push({ file: 'unknown', message: 'Invalid file object' });
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          // 50MB limit
          errors.push({ file: file.name, message: 'File size must be less than 50MB' });
          continue;
        }

        // Upload to Cloudinary using unsigned upload with upload_preset
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', file);
        cloudinaryFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unify_uploads');
        cloudinaryFormData.append('folder', type === 'image' ? 'unify/posts' : 'unify/posts/videos');
        cloudinaryFormData.append('public_id', `${type}_${session.user.id}_${uuidv4()}`);

        console.log(`Uploading ${file.name} to Cloudinary...`);
        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
          {
            method: 'POST',
            body: cloudinaryFormData,
          }
        );

        if (!cloudinaryResponse.ok) {
          const error = await cloudinaryResponse.json().catch(() => ({}));
          console.error('Cloudinary upload error:', error);
          errors.push({ file: file.name, message: 'Failed to upload to cloud storage' });
          continue;
        }

        const cloudinaryData = await cloudinaryResponse.json();
        if (!cloudinaryData.secure_url) {
          throw new Error('No URL returned from Cloudinary');
        }
        
        console.log(`Successfully uploaded ${file.name}: ${cloudinaryData.secure_url}`);
        uploadedUrls.push(cloudinaryData.secure_url);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error uploading file ${file.name}:`, {
          message: errorMsg,
          error: err,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
        errors.push({ 
          file: file.name, 
          message: errorMsg 
        });
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to upload files',
          errorCode: 'UPLOAD_FAILED',
          message: 'All files failed to upload',
          details: errors
        },
        { status: 500 }
      );
    }

    // Return success even if some files failed
    return NextResponse.json({ 
      urls: uploadedUrls,
      success: true,
      ...(errors.length > 0 && { 
        warnings: errors,
        message: `Uploaded ${uploadedUrls.length} of ${files.length} files`
      })
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in upload handler:', {
      message: errorMsg,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Upload failed',
        errorCode: 'SERVER_ERROR',
        message: errorMsg,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
