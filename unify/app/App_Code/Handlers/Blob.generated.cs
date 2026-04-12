namespace FreeTrial.Handlers
{


    public partial class BlobFactoryConfig : BlobFactory
    {

        public static void Initialize()
        {
            // register blob handlers
            RegisterHandler("site_contentData", "\"public\".\"site_content\"", "\"data\"", new string[] {
                        "\"site_content_id\""}, "Site Content Data", "SiteContent", "Data");
        }
    }
}
