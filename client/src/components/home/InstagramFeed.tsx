export function InstagramFeed() {
  const instagramPosts = [
    {
      id: 1,
      imageUrl: "https://images.unsplash.com/photo-1520057806991-23c2a28fbc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      link: "#",
      alt: "Beautiful tropical aquarium with colorful fish and plants"
    },
    {
      id: 2,
      imageUrl: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      link: "#",
      alt: "Vibrant aquatic plants in a planted aquarium setup"
    },
    {
      id: 3,
      imageUrl: "https://images.unsplash.com/photo-1555443805-658637491dd4?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      link: "#",
      alt: "Close-up of betta fish with stunning colors in aquarium"
    },
    {
      id: 4,
      imageUrl: "https://images.unsplash.com/photo-1635111529283-cb1347fb7a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      link: "#",
      alt: "Professionally aquascaped nature style aquarium"
    },
    {
      id: 5,
      imageUrl: "https://images.unsplash.com/photo-1616843413587-9e3a37f7bbd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      link: "#",
      alt: "Discus fish swimming in a well-maintained aquarium"
    },
    {
      id: 6,
      imageUrl: "https://images.unsplash.com/photo-1548269355-c4ca476d14a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      link: "#",
      alt: "Impressive large aquarium setup with various fish species"
    }
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-heading font-bold text-center mb-2">Follow Us on Instagram</h2>
        <p className="text-center text-gray-600 mb-8">@aquaticexotica</p>
        
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
