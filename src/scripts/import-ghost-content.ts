import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/api/supabase';

interface GhostPost {
  id: string;
  title: string;
  slug: string;
  html: string;
  plaintext: string;
  feature_image: string;
  featured: boolean;
  status: string;
  visibility: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  custom_excerpt: string;
  meta_title: string;
  meta_description: string;
  og_image: string;
  og_title: string;
  og_description: string;
  twitter_image: string;
  twitter_title: string;
  twitter_description: string;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
  }>;
  authors: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface GhostExport {
  db: {
    meta: {
      exported_on: number;
      version: string;
    };
    data: {
      posts: GhostPost[];
      tags: Array<{
        id: string;
        name: string;
        slug: string;
        description?: string;
      }>;
      users: Array<{
        id: string;
        name: string;
        slug: string;
        email: string;
      }>;
    };
  };
}

/**
 * Import content from Ghost export
 */
export async function importGhostContent(filePath: string, adminUserId: string) {
  try {
    console.log(`Reading Ghost export file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const ghostData: GhostExport = JSON.parse(fileContent);
    
    console.log(`Found ${ghostData.db.data.posts.length} posts to import`);
    console.log(`Found ${ghostData.db.data.tags.length} tags to import`);
    
    // Import tags first
    const tagMap = new Map<string, string>(); // Ghost tag ID to our tag ID
    
    for (const tag of ghostData.db.data.tags) {
      console.log(`Importing tag: ${tag.name}`);
      
      const { data: existingTag } = await supabase
        .from('content_tags')
        .select('id')
        .eq('slug', tag.slug)
        .single();
      
      if (existingTag) {
        console.log(`Tag already exists: ${tag.name}`);
        tagMap.set(tag.id, existingTag.id);
      } else {
        const { data: newTag, error } = await supabase
          .from('content_tags')
          .insert({
            name: tag.name,
            slug: tag.slug,
            description: tag.description || null
          })
          .select('id')
          .single();
          
        if (error) {
          console.error(`Error importing tag ${tag.name}:`, error);
        } else {
          console.log(`Created tag: ${tag.name} with ID: ${newTag.id}`);
          tagMap.set(tag.id, newTag.id);
        }
      }
    }
    
    // Import posts
    for (const post of ghostData.db.data.posts) {
      console.log(`Importing post: ${post.title}`);
      
      // Check if post already exists
      const { data: existingPost } = await supabase
        .from('content')
        .select('id')
        .eq('slug', post.slug)
        .single();
        
      if (existingPost) {
        console.log(`Post already exists: ${post.title}`);
        continue;
      }
      
      // Map Ghost post to our content schema
      const contentData = {
        title: post.title,
        slug: post.slug,
        content: post.html,
        excerpt: post.custom_excerpt || post.plaintext?.substring(0, 160) || '',
        author_id: adminUserId, // Default to admin user
        status: post.status === 'published' ? 'published' : 'draft',
        visibility: post.visibility === 'public' ? 'public' : 'members',
        type: getContentType(post),
        
        // SEO fields
        seo_title: post.meta_title || post.title,
        seo_description: post.meta_description || post.custom_excerpt || post.plaintext?.substring(0, 160) || '',
        og_image: post.og_image || post.feature_image,
        og_title: post.og_title || post.meta_title || post.title,
        og_description: post.og_description || post.meta_description || post.custom_excerpt || '',
        twitter_image: post.twitter_image || post.og_image || post.feature_image,
        twitter_title: post.twitter_title || post.og_title || post.meta_title || post.title,
        twitter_description: post.twitter_description || post.og_description || post.meta_description || '',
        canonical_url: null,
        
        // Timestamps
        created_at: post.created_at,
        updated_at: post.updated_at,
        published_at: post.published_at
      };
      
      // Insert the content
      const { data: newContent, error } = await supabase
        .from('content')
        .insert(contentData)
        .select('id')
        .single();
        
      if (error) {
        console.error(`Error importing post ${post.title}:`, error);
        continue;
      }
      
      console.log(`Created content: ${post.title} with ID: ${newContent.id}`);
      
      // Connect tags
      if (post.tags && post.tags.length > 0) {
        const tagConnections = post.tags.map(tag => {
          const mappedTagId = tagMap.get(tag.id);
          if (!mappedTagId) {
            console.warn(`Could not find mapped tag ID for Ghost tag: ${tag.name}`);
            return null;
          }
          
          return {
            content_id: newContent.id,
            tag_id: mappedTagId
          };
        }).filter(Boolean);
        
        if (tagConnections.length > 0) {
          const { error: tagError } = await supabase
            .from('content_to_tags')
            .insert(tagConnections);
            
          if (tagError) {
            console.error(`Error connecting tags for post ${post.title}:`, tagError);
          } else {
            console.log(`Connected ${tagConnections.length} tags to post: ${post.title}`);
          }
        }
      }
    }
    
    console.log('Ghost import completed successfully');
    return true;
  } catch (error) {
    console.error('Error importing Ghost content:', error);
    return false;
  }
}

/**
 * Determine content type based on Ghost post properties
 */
function getContentType(post: GhostPost): string {
  // Check if post has tags that indicate content type
  if (post.tags && post.tags.length > 0) {
    const tagNames = post.tags.map(tag => tag.name.toLowerCase());
    
    if (tagNames.includes('tutorial')) return 'tutorial';
    if (tagNames.includes('guide')) return 'guide';
    if (tagNames.includes('course')) return 'course';
  }
  
  // Default to article
  return 'article';
}

// For CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args[0] || path.join(process.cwd(), 'docs/Ghost-Export-31Mar.json');
  const adminUserId = args[1];
  
  if (!adminUserId) {
    console.error('Please provide an admin user ID as the second argument');
    process.exit(1);
  }
  
  importGhostContent(filePath, adminUserId)
    .then(success => {
      if (success) {
        console.log('Import completed successfully');
        process.exit(0);
      } else {
        console.error('Import failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Import error:', error);
      process.exit(1);
    });
} 