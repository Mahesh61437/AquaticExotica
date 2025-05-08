export function InstagramFeed() {
  const instagramPosts = [
    {
      id: 1,
      imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      link: "#",
      alt: "Fashion lifestyle image of person with product in urban setting"
    },
    {
      id: 2,
      imageUrl: "https://images.pexels.com/photos/2584269/pexels-photo-2584269.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      link: "#",
      alt: "Person wearing our knit sweater in outdoor setting"
    },
    {
      id: 3,
      imageUrl: "https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      link: "#",
      alt: "Urban street fashion featuring our denim jacket"
    },
    {
      id: 4,
      imageUrl: "https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      link: "#",
      alt: "Close-up of our leather accessories arranged aesthetically"
    },
    {
      id: 5,
      imageUrl: "https://images.pexels.com/photos/292999/pexels-photo-292999.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      link: "#",
      alt: "Person showing off our footwear in casual setting"
    },
    {
      id: 6,
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      link: "#",
      alt: "Fashion shoot with model wearing our latest collection"
    }
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-heading font-bold text-center mb-2">Follow Us on Instagram</h2>
        <p className="text-center text-gray-600 mb-8">@modernshop_fashion</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {instagramPosts.map((post) => (
            <a 
              key={post.id} 
              href={post.link} 
              className="relative group overflow-hidden aspect-square"
              aria-label={`View our Instagram post: ${post.alt}`}
            >
              <img 
                src={post.imageUrl} 
                alt={post.alt} 
                className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-dark bg-opacity-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                <i className="fa-brands fa-instagram text-white text-2xl"></i>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
