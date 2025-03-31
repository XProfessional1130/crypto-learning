// This configuration tells Next.js to treat the admin platform as a separate root
export default {
  // Disable parent layouts
  unstable_rsc: {
    formAction: false,
    fullUrl: false,
    strictNextjs: false
  },
  
  // Segment configuration
  segment: {
    // This ensures the admin platform doesn't inherit from parent layouts
    isRoot: true,
    
    // Additional configuration to ensure isolation
    dynamic: 'force-dynamic',
    fetchCache: 'default-no-store',
    preferredRegion: 'auto',
    runtime: 'nodejs'
  }
}; 