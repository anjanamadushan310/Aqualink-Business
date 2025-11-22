package com.example.aqualink.config;

import com.example.aqualink.entity.*;
import com.example.aqualink.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserProfileRepository userProfileRepository;
    private final FishRepository fishRepository;
    private final IndustrialStuffRepository industrialStuffRepository;
    private final ServiceRepository serviceRepository;
    private final BlogPostRepository blogPostRepository;
    private final BlogCommentRepository blogCommentRepository;
    private final DeliveryPersonCoverageRepository deliveryPersonCoverageRepository;
    private final DeliveryPersonAvailabilityRepository deliveryPersonAvailabilityRepository;
    private final BannerRepository bannerRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DeliveryQuoteRequestRepository deliveryQuoteRequestRepository;
    private final DeliveryQuoteRepository deliveryQuoteRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedDatabase() {
        return args -> {
            if (shouldSeedData()) {
                log.info("🌱 Starting database seeding...");
                seedUsers();
                seedUserProfiles();
                seedFishAds();
                seedIndustrialStuff();
                seedServices();
                seedBlogPosts();
                seedBlogComments();
                seedDeliveryCoverage();
                seedBanners();
                log.info("✅ Database seeding completed successfully!");
            } else {
                log.info("ℹ️ Database already seeded, skipping...");
            }
            
            // Seed orders independently (has its own check)
            seedOrders();
        };
    }

    private boolean shouldSeedData() {
        // Skip seeding if we already have users (other than the auto-created admin)
        long userCount = userRepository.count();
        return userCount <= 1; // Only admin exists or database is empty
    }

    @Transactional
    public void seedUsers() {
        log.info("Seeding users...");
        
        String encodedPassword = passwordEncoder.encode("password123");
        
        // Shop Owners
        createUser(2L, "199612345678", "Lakshitha Perera", "lakshitha@shop.com", 
                   "+94771234568", encodedPassword, Role.SHOP_OWNER);
        createUser(3L, "199712345678", "Nimal Silva", "nimal@shop.com", 
                   "+94771234569", encodedPassword, Role.SHOP_OWNER);
        
        // Farm Owners
        createUser(4L, "199812345678", "Sunil Fernando", "sunil@farm.com", 
                   "+94771234570", encodedPassword, Role.FARM_OWNER, Role.EXPORTER);
        createUser(5L, "199912345678", "Kamal Jayasinghe", "kamal@farm.com", 
                   "+94771234571", encodedPassword, Role.FARM_OWNER);
        
        // Exporters
        createUser(6L, "200012345678", "Pradeep Wijesinghe", "pradeep@export.com", 
                   "+94771234572", encodedPassword, Role.EXPORTER);
        createUser(7L, "200112345678", "Chandana Rathnayake", "chandana@export.com", 
                   "+94771234573", encodedPassword, Role.EXPORTER);
        
        // Service Providers
        createUser(8L, "200212345678", "Ravi Dissanayake", "ravi@service.com", 
                   "+94771234574", encodedPassword, Role.SERVICE_PROVIDER);
        createUser(9L, "200312345678", "Anjana Madushan", "anjana@service.com", 
                   "+94771234575", encodedPassword, Role.SERVICE_PROVIDER);
        
        // Industrial Stuff Sellers
        createUser(10L, "200412345678", "Mahesh Gunasekara", "mahesh@industrial.com", 
                   "+94771234576", encodedPassword, Role.INDUSTRIAL_STUFF_SELLER);
        createUser(11L, "200512345678", "Tharaka Bandara", "tharaka@industrial.com", 
                   "+94771234577", encodedPassword, Role.INDUSTRIAL_STUFF_SELLER);
        
        // Delivery Persons
        createUser(12L, "200612345678", "Kasun Perera", "kasun@delivery.com", 
                   "+94771234578", encodedPassword, Role.DELIVERY_PERSON);
        createUser(13L, "200712345678", "Dinesh Silva", "dinesh@delivery.com", 
                   "+94771234579", encodedPassword, Role.DELIVERY_PERSON);
        createUser(14L, "200812345678", "Ruwan Fernando", "ruwan@delivery.com", 
                   "+94771234580", encodedPassword, Role.DELIVERY_PERSON);
        
        // Regular Customers
        createUser(15L, "200912345678", "Nuwan Kumara", "nuwan@customer.com", 
                   "+94771234581", encodedPassword);
        createUser(16L, "201012345678", "Samantha De Silva", "samantha@customer.com", 
                   "+94771234582", encodedPassword);
        
        log.info("✅ Created {} users", userRepository.count());
    }

    private void createUser(Long id, String nicNumber, String name, String email, 
                           String phoneNumber, String encodedPassword, Role... roles) {
        if (userRepository.findByEmail(email).isPresent()) {
            return; // Skip if user already exists
        }
        
        User user = new User();
        user.setNicNumber(nicNumber);
        user.setName(name);
        user.setEmail(email);
        user.setPhoneNumber(phoneNumber);
        user.setPassword(encodedPassword);
        user.setActive(true);
        user.setEnabled(true);
        user.setVerificationStatus(VerificationStatus.APPROVED);
        user.setCreatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        
        // Assign roles
        for (Role role : roles) {
            UserRole userRole = new UserRole();
            userRole.setUser(savedUser);
            userRole.setRoleName(role);
            userRoleRepository.save(userRole);
        }
    }

    @Transactional
    public void seedUserProfiles() {
        log.info("Seeding user profiles...");
        
        createProfile("lakshitha@shop.com", "Lakshitha Fish Market", "Fish Market", 
                     "Colombo", "123 Galle Road", "Colombo", "Colombo 03");
        
        createProfile("nimal@shop.com", "Nimal Seafood Center", "Seafood Shop",
                     "Negombo", "456 Main Street", "Gampaha", "Negombo");
        
        createProfile("sunil@farm.com", "Sunil Aqua Farm", "Fish Farm",
                     "Chilaw", "Aqua Farm Road", "Puttalam", "Chilaw");
        
        createProfile("kamal@farm.com", "Kamal Fish Hatchery", "Fish Hatchery",
                     "Kurunegala", "Lake View", "Kurunegala", "Kurunegala");
        
        createProfile("pradeep@export.com", "Pradeep Export Traders", "Export Company",
                     "Katunayake", "789 Export Zone", "Gampaha", "Katunayake");
        
        createProfile("chandana@export.com", "Chandana Global Exports", "Export Company",
                     "Biyagama", "Free Trade Zone", "Gampaha", "Biyagama");
        
        createProfile("ravi@service.com", "Ravi Aquarium Services", "Service Provider",
                     "Kandy", "101 Service Lane", "Kandy", "Kandy");
        
        createProfile("anjana@service.com", "Anjana Pond Consulting", "Consulting Service",
                     "Matara", "202 Consultant Street", "Matara", "Matara");
        
        createProfile("mahesh@industrial.com", "Mahesh Equipment Supplies", "Equipment Supplier",
                     "Horana", "303 Industrial Park", "Kalutara", "Horana");
        
        createProfile("tharaka@industrial.com", "Tharaka Aqua Tech", "Equipment Supplier",
                     "Moratuwa", "404 Tech Zone", "Colombo", "Moratuwa");
        
        log.info("✅ Created user profiles");
    }

    private void createProfile(String email, String businessName, String businessType,
                              String addressPlace, String addressStreet, String addressDistrict, String addressTown) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getUserProfile() == null) {
                UserProfile profile = new UserProfile();
                profile.setUser(user);
                profile.setBusinessName(businessName);
                profile.setBusinessType(businessType);
                profile.setAddressPlace(addressPlace);
                profile.setAddressStreet(addressStreet);
                profile.setAddressDistrict(addressDistrict);
                profile.setAddressTown(addressTown);
                
                // Set logo path - you can replace with actual renamed logo
                String logoFileName = businessName.toLowerCase().replace(" ", "_") + "_logo.jpg";
                profile.setLogoPath("/uploads/logos/" + logoFileName);
                profile.setLogoName(logoFileName);
                profile.setLogoType("image/jpeg");
                
                userProfileRepository.save(profile);
            }
        });
    }

    @Transactional
    public void seedFishAds() {
        log.info("Seeding fish ads...");
        
        User sunil = userRepository.findByEmail("sunil@farm.com").orElse(null);
        User kamal = userRepository.findByEmail("kamal@farm.com").orElse(null);
        
        if (sunil != null) {
            createFishAd(sunil, "Tilapia", "Fresh Tilapia fish, farm-raised with organic feed. Perfect for grilling and curries.", 
                        500, 450.00, 5);
            createFishAd(sunil, "Catfish", "Premium quality Catfish, locally bred. Ideal for traditional Sri Lankan recipes.", 
                        300, 550.00, 3);
            createFishAd(sunil, "Carp", "Large Carp fish, freshwater species. Great source of protein.", 
                        200, 650.00, 2);
            createFishAd(sunil, "Giant Gourami", "Large Giant Gourami, suitable for big ponds and aquaculture.", 
                        100, 1200.00, 2);
            createFishAd(sunil, "Fingerlings - Tilapia", "Tilapia fingerlings for pond stocking. Healthy and fast-growing.", 
                        5000, 15.00, 100);
            createFishAd(sunil, "Freshwater Prawns", "Giant freshwater prawns, excellent for aquaculture.", 
                        250, 850.00, 5);
        }
        
        if (kamal != null) {
            createFishAd(kamal, "Gourami", "Colorful Gourami fish, perfect for aquariums and home ponds.", 
                        1000, 150.00, 10);
            createFishAd(kamal, "Koi Fish", "Beautiful ornamental Koi fish in various colors. Premium quality.", 
                        150, 2500.00, 1);
            createFishAd(kamal, "Goldfish", "Classic Goldfish varieties, healthy and vibrant. Perfect for beginners.", 
                        800, 200.00, 5);
            createFishAd(kamal, "Barb Fish", "Active and hardy Barb fish species. Great for community tanks.", 
                        600, 180.00, 10);
        }
        
        log.info("✅ Created fish ads");
    }

    private void createFishAd(User user, String name, String description, int stock, double price, int minQty) {
        Fish fish = new Fish();
        fish.setUser(user);
        fish.setNicNumber(user.getNicNumber());
        fish.setName(name);
        fish.setDescription(description);
        fish.setStock(stock);
        fish.setPrice(price);
        fish.setMinimumQuantity(minQty);
        fish.setActiveStatus(ActiveStatus.VERIFIED);
        fish.setCreateDateAndTime(LocalDateTime.now());
        
        // Set image paths - you can replace these with actual renamed images
        fish.setImagePaths(Arrays.asList(
            "/uploads/fish_images/" + name.toLowerCase().replace(" ", "_") + "_1.jpg",
            "/uploads/fish_images/" + name.toLowerCase().replace(" ", "_") + "_2.jpg"
        ));
        
        fishRepository.save(fish);
    }

    @Transactional
    public void seedIndustrialStuff() {
        log.info("Seeding industrial equipment...");
        
        User mahesh = userRepository.findByEmail("mahesh@industrial.com").orElse(null);
        User tharaka = userRepository.findByEmail("tharaka@industrial.com").orElse(null);
        
        if (mahesh != null) {
            createEquipment(mahesh, "Aquarium Filter System", 
                          "High-efficiency filtration system for aquariums up to 500L. Includes biological and mechanical filtration.", 
                          50, 8500.00, 1);
            createEquipment(mahesh, "Fish Food - Premium Mix", 
                          "Nutritious fish food pellets suitable for all fish species. 5kg pack.", 
                          200, 1200.00, 2);
            createEquipment(mahesh, "Pond Aerator", 
                          "Electric pond aerator with air stone. Suitable for ponds up to 1000L.", 
                          30, 12500.00, 1);
            createEquipment(mahesh, "Water Testing Kit", 
                          "Complete water quality testing kit. Tests pH, ammonia, nitrite, and nitrate levels.", 
                          100, 2500.00, 1);
            createEquipment(mahesh, "Fish Net - Professional", 
                          "Durable nylon fish net with extendable handle. Large size.", 
                          150, 850.00, 1);
            createEquipment(mahesh, "Pond Liner Sheet", 
                          "Heavy-duty HDPE pond liner. 4m x 6m sheet.", 
                          60, 9500.00, 1);
            createEquipment(mahesh, "Aquarium LED Light", 
                          "Energy-efficient LED lighting for aquariums. Adjustable brightness.", 
                          100, 4500.00, 1);
        }
        
        if (tharaka != null) {
            createEquipment(tharaka, "Automatic Fish Feeder", 
                          "Programmable automatic fish feeder. Perfect for busy fish farmers.", 
                          40, 6500.00, 1);
            createEquipment(tharaka, "UV Sterilizer", 
                          "UV water sterilizer for disease prevention. 25W capacity.", 
                          25, 15000.00, 1);
            createEquipment(tharaka, "Breeding Tank Kit", 
                          "Complete breeding tank setup with dividers and accessories.", 
                          20, 18500.00, 1);
            createEquipment(tharaka, "Water Heater - Aquarium", 
                          "Adjustable water heater for tropical fish. 300W.", 
                          80, 3500.00, 1);
            createEquipment(tharaka, "Fish Transport Bags", 
                          "Oxygen-filled transport bags for live fish. Pack of 100.", 
                          500, 2000.00, 5);
        }
        
        log.info("✅ Created industrial equipment");
    }

    private void createEquipment(User user, String name, String description, int stock, double price, int minQty) {
        IndustrialStuff equipment = new IndustrialStuff();
        equipment.setUser(user);
        equipment.setNicNumber(user.getNicNumber());
        equipment.setName(name);
        equipment.setDescription(description);
        equipment.setStock(stock);
        equipment.setPrice(price);
        equipment.setActiveStatus(ActiveStatus.VERIFIED);
        equipment.setCreateDateAndTime(LocalDateTime.now());
        
        // Set image paths - you can replace these with actual renamed images
        equipment.setImagePaths(Arrays.asList(
            "/uploads/industrial_images/" + name.toLowerCase().replace(" ", "_") + "_1.jpg",
            "/uploads/industrial_images/" + name.toLowerCase().replace(" ", "_") + "_2.jpg"
        ));
        
        industrialStuffRepository.save(equipment);
    }

    @Transactional
    public void seedServices() {
        log.info("Seeding services...");
        
        User ravi = userRepository.findByEmail("ravi@service.com").orElse(null);
        User anjana = userRepository.findByEmail("anjana@service.com").orElse(null);
        
        if (ravi != null) {
            createService(ravi, "Aquarium Setup & Installation", 
                        "Professional aquarium setup service including tank, filtration, lighting, and decoration. We handle everything from delivery to installation and initial fish stocking.", 
                        "Installation", 25000.00);
            createService(ravi, "Aquarium Maintenance - Monthly", 
                        "Regular monthly maintenance service including water changes, filter cleaning, algae removal, and health checkups.", 
                        "Maintenance", 3500.00);
            createService(ravi, "Fish Disease Treatment", 
                        "Expert diagnosis and treatment of fish diseases. Includes consultation and medication.", 
                        "Healthcare", 5000.00);
            createService(ravi, "Emergency Fish Care", 
                        "24/7 emergency fish care service for critical situations. Call-out service.", 
                        "Emergency", 7500.00);
            createService(ravi, "Custom Aquarium Design", 
                        "Custom aquarium design service for homes and offices. Includes 3D visualization.", 
                        "Design", 12000.00);
        }
        
        if (anjana != null) {
            createService(anjana, "Fish Farm Consultation", 
                        "Professional consultation for starting or improving fish farming operations. Includes site visit and detailed report.", 
                        "Consultation", 15000.00);
            createService(anjana, "Pond Construction Service", 
                        "Complete pond construction service including excavation, lining, and plumbing setup.", 
                        "Construction", 150000.00);
            createService(anjana, "Fish Farming Training Program", 
                        "Comprehensive 2-day training program on modern fish farming techniques and best practices.", 
                        "Training", 8000.00);
            createService(anjana, "Water Quality Management", 
                        "Water quality testing and management service. Includes testing, analysis, and recommendations.", 
                        "Management", 6500.00);
        }
        
        log.info("✅ Created services");
    }

    private void createService(User user, String name, String description, String category, double price) {
        Service service = new Service();
        service.setServiceProviderId(user.getId());
        service.setName(name);
        service.setDescription(description);
        service.setCategory(category);
        service.setPrice(new java.math.BigDecimal(price));
        service.setApprovalStatus(Service.ApprovalStatus.APPROVED);
        service.setCreatedAt(LocalDateTime.now());
        
        // Set image paths - you can replace these with actual renamed images
        service.setImagePaths(Arrays.asList(
            "/uploads/service_images/" + name.toLowerCase().replace(" ", "_") + "_1.jpg",
            "/uploads/service_images/" + name.toLowerCase().replace(" ", "_") + "_2.jpg"
        ));
        
        serviceRepository.save(service);
    }

    @Transactional
    public void seedBlogPosts() {
        log.info("Seeding blog posts...");
        
        User pradeep = userRepository.findByEmail("pradeep@export.com").orElse(null);
        User chandana = userRepository.findByEmail("chandana@export.com").orElse(null);
        
        if (pradeep != null) {
            createBlogPost(pradeep, "Best Practices for Fish Farming in Sri Lanka",
                "<h2>Introduction to Modern Fish Farming</h2>" +
                "<p>Fish farming in Sri Lanka has evolved significantly over the past decade, transforming from traditional methods to modern aquaculture practices. This comprehensive guide explores the best practices that have helped local fish farmers achieve sustainable success while maintaining environmental responsibility.</p>" +
                "<h3>Understanding the Sri Lankan Aquaculture Landscape</h3>" +
                "<p>Sri Lanka's tropical climate and abundant water resources create ideal conditions for fish farming. However, success requires more than just favorable conditions. Farmers must understand water quality management, disease prevention, and sustainable feeding practices to maximize their yields while protecting the environment.</p>" +
                "<h3>Water Quality Management</h3>" +
                "<p>Maintaining optimal water quality is the foundation of successful fish farming. Regular monitoring of pH levels (ideally 6.5-8.5), dissolved oxygen (minimum 5mg/L), and ammonia levels is essential. Install aeration systems in ponds to ensure adequate oxygen supply, especially during hot weather. Weekly water testing helps identify problems before they affect fish health.</p>" +
                "<h3>Disease Prevention Strategies</h3>" +
                "<p>Prevention is always better than cure in aquaculture. Implement biosecurity measures including quarantine periods for new stock, regular health inspections, and proper waste management. Avoid overstocking, which creates stress and increases disease susceptibility. When purchasing fingerlings, choose reputable hatcheries with certified disease-free stock.</p>" +
                "<h3>Sustainable Feeding Practices</h3>" +
                "<p>Feed represents 60-70% of operational costs in fish farming. Use high-quality commercial feeds appropriate for your fish species and growth stage. Feed 2-3 times daily, providing only what fish can consume in 15-20 minutes. Consider supplementing commercial feeds with locally available ingredients to reduce costs while maintaining nutrition.</p>" +
                "<h3>Pond Management and Maintenance</h3>" +
                "<p>Regular pond maintenance prevents many common problems. Remove excess algae and aquatic plants that compete for oxygen. Check and maintain pond embankments to prevent leaks. Clean filters and aerators weekly. Between harvests, dry ponds completely and apply lime to eliminate parasites and improve soil quality.</p>" +
                "<h3>Record Keeping and Business Management</h3>" +
                "<p>Successful farmers maintain detailed records of stocking dates, feeding schedules, water quality parameters, and harvest data. This information helps identify trends, optimize feeding strategies, and make informed business decisions. Track expenses and income carefully to understand profitability and identify areas for improvement.</p>" +
                "<h3>Marketing and Value Addition</h3>" +
                "<p>Don't just focus on production - develop strong marketing strategies. Build relationships with local markets, restaurants, and exporters. Consider value-added products like smoked or filleted fish to increase profit margins. Join farmer cooperatives to access better prices and shared resources.</p>" +
                "<h3>Conclusion</h3>" +
                "<p>Modern fish farming in Sri Lanka offers excellent opportunities for those willing to adopt scientific practices and maintain consistent management. By following these best practices, farmers can achieve sustainable production, ensure fish health, and build profitable businesses that contribute to food security and economic development.</p>",
                LocalDateTime.now().minusDays(10), 245);
            
            createBlogPost(pradeep, "Export Quality Standards for Seafood",
                "<h2>Understanding International Seafood Standards</h2>" +
                "<p>Exporting seafood from Sri Lanka requires strict adherence to international quality and safety standards. This comprehensive guide covers everything you need to know about meeting export requirements and maintaining product quality throughout the supply chain.</p>" +
                "<h3>Key International Certification Requirements</h3>" +
                "<p>The primary certifications for seafood exports include HACCP (Hazard Analysis Critical Control Points), ISO 22000 for food safety management, and country-specific certifications like EU approval numbers or USDA compliance. These certifications demonstrate your commitment to food safety and open doors to premium international markets.</p>" +
                "<h3>Temperature Control and Cold Chain Management</h3>" +
                "<p>Maintaining the cold chain is critical for seafood quality. Fresh fish must be chilled to 0-4°C immediately after harvest. Frozen products require storage at -18°C or below. Use calibrated thermometers at every stage and maintain detailed temperature logs. Any break in the cold chain can compromise product safety and result in rejected shipments.</p>" +
                "<h3>Hygiene and Sanitation Protocols</h3>" +
                "<p>Processing facilities must meet stringent hygiene standards. Implement regular cleaning schedules using approved sanitizers. Workers must wear appropriate protective clothing, including hairnets, gloves, and clean uniforms. Establish handwashing protocols and restrict access to processing areas. Regular facility audits help identify and address hygiene issues before they affect exports.</p>" +
                "<h3>Traceability Systems</h3>" +
                "<p>Modern seafood exports require complete traceability from farm to consumer. Implement systems that track harvest dates, processing batches, storage conditions, and distribution channels. Use unique lot numbers and maintain comprehensive records. Traceability not only meets legal requirements but also protects your brand reputation and enables quick recall if needed.</p>" +
                "<h3>Chemical and Microbiological Testing</h3>" +
                "<p>Regular laboratory testing is non-negotiable for exports. Test for harmful bacteria like Salmonella, E. coli, and Vibrio species. Monitor antibiotic residues, heavy metals, and histamine levels. Partner with accredited laboratories and maintain testing schedules that meet or exceed importing country requirements.</p>" +
                "<h3>Packaging and Labeling Requirements</h3>" +
                "<p>Export packaging must protect product quality while meeting regulatory requirements. Use food-grade materials appropriate for your product. Labels must include species name (both common and scientific), net weight, production date, expiry date, storage instructions, and country of origin. Ensure labels are in the language required by the destination country.</p>" +
                "<h3>Documentation and Compliance</h3>" +
                "<p>Export documentation includes health certificates, catch certificates (for wild-caught seafood), commercial invoices, and bills of lading. Work with experienced freight forwarders who understand seafood logistics. Keep copies of all documentation for at least two years to facilitate audits and resolve any issues.</p>" +
                "<h3>Staying Updated with Changing Regulations</h3>" +
                "<p>International seafood regulations evolve constantly. Subscribe to updates from regulatory bodies like the FDA, EU Commission, and relevant industry associations. Attend export training programs and trade shows. Building relationships with importers helps you stay informed about market requirements and emerging trends.</p>",
                LocalDateTime.now().minusDays(8), 189);
            
            createBlogPost(pradeep, "Sustainable Fishing Practices for the Future",
                "<h2>The Importance of Sustainability in Modern Aquaculture</h2>" +
                "<p>As the global demand for seafood continues to rise, sustainable fishing and farming practices have never been more important. This article explores how Sri Lankan aquaculture can balance production needs with environmental conservation to ensure long-term viability of the industry.</p>" +
                "<h3>Understanding Environmental Impact</h3>" +
                "<p>Traditional intensive fish farming can impact water quality, deplete wild fish stocks used for feed, and affect local ecosystems. However, sustainable practices can minimize these effects while maintaining profitability. Understanding your operation's environmental footprint is the first step toward implementing meaningful improvements.</p>" +
                "<h3>Integrated Multi-Trophic Aquaculture (IMTA)</h3>" +
                "<p>IMTA systems combine different species that complement each other ecologically. For example, fish waste provides nutrients for seaweed or vegetables grown in the same water system, which then filter the water for the fish. This creates a balanced ecosystem that reduces waste, improves water quality, and provides multiple income streams.</p>" +
                "<h3>Sustainable Feed Alternatives</h3>" +
                "<p>Traditional fish feeds rely heavily on wild-caught fish meal, creating sustainability concerns. Modern alternatives include plant-based proteins, insect meal, and algae-based feeds. Sri Lankan farmers can explore locally available ingredients like rice bran, coconut meal, and vegetable proteins to create sustainable, cost-effective feed formulations.</p>" +
                "<h3>Water Conservation and Recycling</h3>" +
                "<p>Recirculating Aquaculture Systems (RAS) can reduce water usage by up to 99% compared to traditional methods. While initial investment is higher, RAS allows greater production density and better disease control. Even simple improvements like pond water recycling for irrigation can significantly reduce freshwater consumption.</p>" +
                "<h3>Energy Efficiency Measures</h3>" +
                "<p>Aquaculture requires significant energy for aeration, pumping, and temperature control. Invest in energy-efficient equipment like solar-powered aerators and optimized pump systems. Consider renewable energy sources such as solar panels to reduce both operational costs and carbon footprint.</p>" +
                "<h3>Biodiversity Conservation</h3>" +
                "<p>Prevent farmed fish from escaping into natural water bodies where they could compete with or breed with wild populations. Use native or locally adapted species when possible. Maintain buffer zones around farms to protect natural habitats and water quality. Support conservation efforts for threatened wild fish populations.</p>" +
                "<h3>Community Engagement and Fair Trade</h3>" +
                "<p>Sustainable aquaculture extends beyond environmental concerns to include social responsibility. Provide fair wages and safe working conditions. Engage with local communities to address concerns and share benefits. Support local economies by sourcing materials and services locally when possible.</p>" +
                "<h3>Certification and Market Access</h3>" +
                "<p>Sustainable certifications like ASC (Aquaculture Stewardship Council) or BAP (Best Aquaculture Practices) open doors to premium markets and conscious consumers willing to pay higher prices for sustainably produced seafood. These certifications also provide frameworks for continuous improvement in environmental and social performance.</p>" +
                "<h3>The Business Case for Sustainability</h3>" +
                "<p>While some sustainable practices require upfront investment, they often reduce long-term costs through improved efficiency, better fish health, and access to premium markets. Sustainable operations are also more resilient to regulatory changes and market shifts toward environmentally conscious products.</p>" +
                "<h3>Looking Forward</h3>" +
                "<p>The future of aquaculture lies in balancing production with conservation. By adopting sustainable practices today, Sri Lankan fish farmers can ensure their operations remain viable for generations while contributing to global food security and environmental protection. Start small, measure progress, and continuously improve - every step toward sustainability counts.</p>",
                LocalDateTime.now().minusDays(3), 156);
        }
        
        if (chandana != null) {
            createBlogPost(chandana, "Setting Up Your First Aquarium: A Beginner's Guide",
                "<h2>Welcome to the World of Aquariums!</h2>" +
                "<p>Starting your first aquarium can be an exciting journey into the fascinating world of aquatic life. This comprehensive beginner's guide will walk you through every step of setting up a successful aquarium, from choosing the right tank to maintaining a thriving aquatic ecosystem.</p>" +
                "<h3>Choosing the Right Aquarium Size and Location</h3>" +
                "<p>Contrary to popular belief, bigger is often easier for beginners. A 20-30 gallon tank provides more stability in water parameters than smaller tanks. Choose a location away from direct sunlight, which encourages algae growth, and away from heating vents or air conditioners. Ensure the stand can support the weight - a filled 20-gallon tank weighs about 200 pounds.</p>" +
                "<h3>Essential Equipment for Your First Tank</h3>" +
                "<p>You'll need a filter rated for your tank size (or slightly larger), a heater for tropical fish (preset to 76-78°F), a thermometer, LED lighting appropriate for your setup, and a water testing kit. Don't skimp on the filter - good filtration is crucial for fish health. Consider a sponge filter or hang-on-back filter for beginners.</p>" +
                "<h3>Understanding the Nitrogen Cycle</h3>" +
                "<p>Before adding fish, your tank must complete the nitrogen cycle. Fish waste produces ammonia, which beneficial bacteria convert to nitrite, then to less harmful nitrate. This process takes 4-6 weeks. You can speed it up by adding bacterial starter cultures or using established filter media from a healthy aquarium. Test water regularly and wait until ammonia and nitrite read zero before adding fish.</p>" +
                "<h3>Substrate and Decorations</h3>" +
                "<p>Choose substrate based on your planned fish and plants. Gravel is easy to maintain, while sand suits bottom-dwelling fish like corydoras. Rinse substrate thoroughly before adding to prevent cloudy water. Add decorations like rocks, driftwood, and plants to create hiding spots and reduce fish stress. Live plants help maintain water quality but require appropriate lighting.</p>" +
                "<h3>Selecting Your First Fish</h3>" +
                "<p>Start with hardy, peaceful species that tolerate beginner mistakes. Good choices include tetras, guppies, platies, or corydoras catfish. Research each species' adult size, temperament, and water requirements. Follow the rule of one inch of fish per gallon of water (excluding tail length). Add fish gradually - 2-3 fish per week - to avoid overwhelming your biological filter.</p>" +
                "<h3>Water Parameters and Testing</h3>" +
                "<p>Test your water weekly for ammonia, nitrite, nitrate, pH, and hardness. Most community fish thrive in pH 6.5-7.5 and moderate hardness. Keep ammonia and nitrite at zero, and nitrate below 20ppm. Use a dechlorinator when adding tap water, as chlorine kills beneficial bacteria and harms fish.</p>" +
                "<h3>Feeding Your Fish Properly</h3>" +
                "<p>Overfeeding is the most common beginner mistake. Feed only what your fish can consume in 2-3 minutes, once or twice daily. Use high-quality flakes or pellets as a staple, supplemented with frozen or live foods occasionally. One fasting day per week helps prevent digestive issues. Remove uneaten food promptly to prevent water quality problems.</p>" +
                "<h3>Maintenance Schedule</h3>" +
                "<p>Establish a regular maintenance routine: daily feeding and observation, weekly water testing and 20-30% water changes, monthly filter maintenance (rinse in tank water, never tap water), and periodic glass cleaning. Consistency prevents problems and keeps your fish healthy. Keep a maintenance log to track patterns and identify issues early.</p>" +
                "<h3>Common Mistakes to Avoid</h3>" +
                "<p>Don't rush the cycling process, avoid overcrowding, resist adding too many fish at once, and don't perform large water changes unless addressing an emergency. Never use soap or chemicals near your aquarium. Research fish compatibility before purchasing - not all species can live together peacefully.</p>" +
                "<h3>Troubleshooting Common Issues</h3>" +
                "<p>Cloudy water usually indicates bacterial bloom during cycling or overfeeding. Green water suggests excess light or nutrients - reduce lighting and feeding. Brown algae is common in new tanks and usually resolves naturally. If fish gasp at the surface, check oxygen levels and water parameters immediately.</p>" +
                "<h3>Growing as an Aquarist</h3>" +
                "<p>Join local aquarium clubs and online communities to learn from experienced hobbyists. Start a quarantine tank for new fish to prevent disease introduction. As you gain experience, you might explore planted tanks, breeding programs, or specialized setups for specific species. The aquarium hobby offers endless opportunities for learning and enjoyment.</p>",
                LocalDateTime.now().minusDays(5), 312);
            
            createBlogPost(chandana, "Common Fish Diseases and How to Prevent Them",
                "<h2>Fish Health Management: Prevention is Better Than Cure</h2>" +
                "<p>Preventing fish diseases is far more effective than treating them. This comprehensive guide covers the most common fish diseases, their symptoms, causes, and most importantly, prevention strategies to keep your fish healthy and thriving.</p>" +
                "<h3>Understanding Fish Immunity</h3>" +
                "<p>Fish have immune systems, but they're heavily influenced by environmental conditions. Stress from poor water quality, overcrowding, or sudden parameter changes weakens immunity, making fish susceptible to opportunistic pathogens always present in aquariums. Maintaining optimal conditions is your first line of defense against disease.</p>" +
                "<h3>Ich (White Spot Disease)</h3>" +
                "<p>Ich appears as white spots resembling salt grains on fish bodies and fins. Fish may scratch against objects and show rapid breathing. Caused by the parasite Ichthyophthirius multifiliis, it thrives in stressed fish and temperature fluctuations. Prevention includes maintaining stable temperatures, quarantining new fish for 3-4 weeks, and avoiding sudden water changes. Treatment involves raising temperature to 86°F gradually and using ich medications according to package directions.</p>" +
                "<h3>Fin Rot and Tail Rot</h3>" +
                "<p>Bacterial infections cause fins to appear ragged, frayed, or discolored, often with white edges. Poor water quality is the primary cause. Prevention requires excellent filtration, regular water changes (20-30% weekly), and avoiding overcrowding. Maintain ammonia and nitrite at zero. Treatment involves improving water quality immediately and using antibacterial medications if necessary. Severe cases may require antibiotic treatment under veterinary guidance.</p>" +
                "<h3>Fungal Infections</h3>" +
                "<p>White, cotton-like growth on fish indicates fungal infection, usually secondary to injury or other disease. Fungi exploit weakened fish with damaged slime coats. Prevention includes avoiding sharp decorations, handling fish carefully, and maintaining water quality. Quarantine injured fish and treat with antifungal medications. Salt baths (1 tablespoon per gallon for 15 minutes) can help mild cases.</p>" +
                "<h3>Dropsy</h3>" +
                "<p>Characterized by swollen body and raised scales resembling a pinecone, dropsy indicates serious internal bacterial infection or organ failure. Often fatal, prevention is crucial. Maintain pristine water quality, avoid overfeeding, and provide a balanced diet. Quarantine affected fish immediately to prevent spread. Treatment success is low, but antibiotics and epsom salt baths may help if caught very early.</p>" +
                "<h3>Velvet Disease</h3>" +
                "<p>This parasitic infection causes a gold or rust-colored dust appearance on fish. Affected fish may scratch, clamp fins, and lose appetite. Caused by Oodinium parasites, it spreads quickly in stressed populations. Prevention includes quarantine procedures and stress reduction. Darken the tank (parasites need light) and treat with copper-based medications or malachite green following product instructions carefully.</p>" +
                "<h3>Swim Bladder Disease</h3>" +
                "<p>Fish swimming upside down, sideways, or struggling to maintain position indicates swim bladder issues. Causes include overfeeding, constipation, bacterial infection, or genetic factors. Prevention focuses on proper feeding - small meals twice daily, fasting one day weekly, and pre-soaking dried foods. For constipation, fast fish for 2-3 days then feed blanched peas. Bacterial cases may require antibiotics.</p>" +
                "<h3>Establishing a Quarantine Protocol</h3>" +
                "<p>A quarantine tank is essential disease prevention. Set up a bare-bottom 10-20 gallon tank with sponge filter and heater. Quarantine all new fish, plants, and decorations for 3-4 weeks before adding to main tank. This period allows observation for disease and time to treat if needed without risking your established fish.</p>" +
                "<h3>Water Quality as Disease Prevention</h3>" +
                "<p>The single most important disease prevention factor is water quality. Test weekly for ammonia, nitrite, and nitrate. Maintain 0 ammonia, 0 nitrite, and nitrate below 20ppm through regular water changes and appropriate filtration. Monitor pH stability and avoid drastic parameter swings. Clean substrate regularly to remove waste buildup.</p>" +
                "<h3>Nutrition and Fish Health</h3>" +
                "<p>A varied, quality diet strengthens fish immune systems. Use high-quality staple foods supplemented with frozen or live foods like brine shrimp, bloodworms, and vegetables for herbivores. Avoid overfeeding - it degrades water quality and causes digestive issues. Store food properly to maintain nutritional value and prevent contamination.</p>" +
                "<h3>Stress Reduction Strategies</h3>" +
                "<p>Chronic stress is a major disease contributor. Provide adequate hiding spots and appropriate tank mates. Avoid aggressive species with peaceful fish. Maintain consistent lighting schedule (8-10 hours daily). Minimize noise and vibration near the tank. Perform maintenance consistently and avoid sudden changes. Stressed fish show clamped fins, faded colors, and hiding behavior.</p>" +
                "<h3>When to Seek Professional Help</h3>" +
                "<p>Consult aquatic veterinarians or experienced aquarists for unusual symptoms, rapid fish deaths, or treatment-resistant diseases. Document symptoms with photos, water parameters, and timeline. Some diseases require prescription medications or laboratory diagnosis. Join aquarium forums or local clubs for advice, but verify information from multiple reliable sources before acting.</p>",
                LocalDateTime.now().minusDays(2), 98);
        }
        
        log.info("✅ Created blog posts");
    }

    private void createBlogPost(User author, String title, String content, LocalDateTime createdAt, int views) {
        BlogPost post = new BlogPost();
        post.setAuthor(author);
        post.setTitle(title);
        post.setContent(content);
        post.setPublished(true);
        post.setCreatedAt(createdAt);
        post.setUpdatedAt(createdAt);
        post.setPublishedAt(createdAt);
        
        // Set featured image path - you can replace with actual renamed image
        post.setFeaturedImagePath("/uploads/blog/" + title.toLowerCase().replace(" ", "_").substring(0, 30) + ".jpg");
        
        blogPostRepository.save(post);
    }

    @Transactional
    public void seedBlogComments() {
        log.info("Seeding blog comments...");
        // Blog comments seeding would go here
        // Simplified for brevity
    }

    @Transactional
    public void seedDeliveryCoverage() {
        log.info("Seeding delivery coverage...");
        
        User kasun = userRepository.findByEmail("kasun@delivery.com").orElse(null);
        User dinesh = userRepository.findByEmail("dinesh@delivery.com").orElse(null);
        User ruwan = userRepository.findByEmail("ruwan@delivery.com").orElse(null);
        
        // Set all delivery persons as available
        if (kasun != null) {
            setAvailability(kasun, true);
            createCoverage(kasun, getAllWesternProvinceTowns());
        }
        
        if (dinesh != null) {
            setAvailability(dinesh, true);
            // Dinesh gets ALL towns in Sri Lanka
            createCoverage(dinesh, getAllSriLankaTowns());
        }
        
        if (ruwan != null) {
            setAvailability(ruwan, true);
            createCoverage(ruwan, getAllSouthernProvinceTowns());
        }
        
        log.info("✅ Created delivery coverage areas");
    }

    private void setAvailability(User user, boolean isAvailable) {
        DeliveryPersonAvailability availability = deliveryPersonAvailabilityRepository
                .findByDeliveryPersonUser(user)
                .orElse(new DeliveryPersonAvailability());
        
        availability.setDeliveryPersonUser(user);
        availability.setIsAvailable(isAvailable);
        availability.setLastUpdated(LocalDateTime.now());
        deliveryPersonAvailabilityRepository.save(availability);
    }

    private void createCoverage(User user, List<String> towns) {
        // Find existing coverage or create new - returns List, so handle accordingly
        List<DeliveryPersonCoverage> existingCoverages = deliveryPersonCoverageRepository
                .findByDeliveryPersonUser(user);
        
        DeliveryPersonCoverage coverage;
        if (!existingCoverages.isEmpty()) {
            coverage = existingCoverages.get(0);
        } else {
            coverage = new DeliveryPersonCoverage();
            coverage.setDeliveryPersonUser(user);
        }
        
        // Convert raw town names to "District:Town" format
        List<String> formattedTowns = formatTownsWithDistricts(towns);
        coverage.setTowns(formattedTowns);
        deliveryPersonCoverageRepository.save(coverage);
        
        log.info("✅ Set coverage for {} with {} towns (formatted)", user.getEmail(), formattedTowns.size());
    }
    
    /**
     * Convert raw town names to "District:Town" format by matching towns to their districts
     */
    private List<String> formatTownsWithDistricts(List<String> towns) {
        List<String> formattedTowns = new ArrayList<>();
        
        // Create a map of town -> district for fast lookup
        Map<String, String> townToDistrict = new HashMap<>();
        
        // Populate the map with all district-town relationships
        populateTownToDistrictMap(townToDistrict);
        
        // Format each town with its district
        for (String town : towns) {
            String district = townToDistrict.get(town);
            if (district != null) {
                formattedTowns.add(district + ":" + town);
            } else {
                // If district not found, try to infer or skip
                log.warn("⚠️ Could not find district for town: {}", town);
            }
        }
        
        return formattedTowns;
    }
    
    /**
     * Populate a map of town names to their districts based on Sri Lankan geography
     */
    private void populateTownToDistrictMap(Map<String, String> map) {
        // Ampara District
        Arrays.asList("Ampara", "Akkaraipattu", "Kalmunai", "Sammanthurai", "Uhana", "Mahaoya", "Damana", "Lahugala",
            "Addalachchenai", "Thirukkovil", "Pottuvil", "Arugam Bay", "Komari", "Navithanveli", "Padiyathalawa",
            "Maha Oya", "Digamadulla", "Dehiattakandiya", "Ampara Town", "Sainthamaruthu", "Nindavur",
            "Kondavil", "Kiran", "Maharagama", "Rugam", "Panama", "Oluvil")
            .forEach(town -> map.put(town, "Ampara"));
        
        // Anuradhapura District
        Arrays.asList("Anuradhapura", "Kekirawa", "Thambuttegama", "Eppawala", "Galenbindunuwewa", "Mihintale", "Medawachchiya", "Rambewa",
            "Tambuttegama", "Horowpothana", "Kahatagasdigiliya", "Rajanganaya", "Palugaswewa", "Galnewa", "Palagala",
            "Tirappane", "Nochchiyagama", "Maradankadawala", "Talawa", "Ipalogama", "Nachchaduwa", "Kebithigollewa",
            "Padaviya", "Galkadawala", "Bogahawewa", "Thirappane", "Habarana", "Iranmadu")
            .forEach(town -> map.put(town, "Anuradhapura"));
        
        // Badulla District
        Arrays.asList("Badulla", "Bandarawela", "Ella", "Haputale", "Welimada", "Mahiyanganaya", "Passara", "Hali Ela",
            "Diyathalawa", "Demodara", "Kandapola", "Namunukula", "Soranathota", "Haputhale", "Idalgashinna",
            "Ohiya", "Ambewela", "Poonagala", "Haldummulla", "Lunugala", "Rideegama", "Meegahakivula",
            "Uva Paranagama", "Ella Gap", "Badulla Town", "Kinchigune", "Keppetipola", "Bellhuloya")
            .forEach(town -> map.put(town, "Badulla"));
        
        // Batticaloa District
        Arrays.asList("Batticaloa", "Kattankudy", "Eravur", "Valachchenai", "Chenkalady", "Oddamavadi", "Kaluwanchikudy",
            "Kiran", "Manmunai North", "Manmunai South", "Manmunai Pattu", "Koralaipattu North", "Koralaipattu",
            "Porativu Pattu", "Unnichchai", "Paddippalai", "Kalkudah", "Passikudah", "Kokkaddicholai",
            "Araipattai", "Vellaveli", "Amirabad", "Navatkadu", "Kodukamam", "Mahiladithivu", "Kirimechchiya")
            .forEach(town -> map.put(town, "Batticaloa"));
        
        // Colombo District
        Arrays.asList("Colombo", "Sri Jayawardenepura Kotte", "Dehiwala-Mount Lavinia", "Moratuwa", "Kesbewa", "Maharagama", "Kotikawatta", "Mulleriyawa",
            "Rajagiriya", "Battaramulla", "Kottawa", "Pannipitiya", "Homagama", "Padukka", "Hanwella", "Avissawella",
            "Nugegoda", "Boralesgamuwa", "Piliyandala", "Kelaniya", "Wattala", "Ja-Ela", "Kandana", "Negombo",
            "Katunayake", "Seeduwa", "Minuwangoda", "Gampaha", "Veyangoda", "Mirigama", "Kirindiwela", "Dompe",
            "Kadawatha", "Ragama", "Kiribathgoda", "Delkanda", "Wellampitiya", "Kolonnawa", "Kotte", "Malabe",
            "Athurugiriya", "Thalawathugoda", "Godagama", "Rathmalana", "Kalubowila", "Rawathawatte", "Dehiwala")
            .forEach(town -> map.put(town, "Colombo"));
        
        // Galle District
        Arrays.asList("Galle", "Hikkaduwa", "Ambalangoda", "Bentota", "Elpitiya", "Karapitiya", "Baddegama", "Yakkalamulla",
            "Unawatuna", "Kosgoda", "Balapitiya", "Ahungalla", "Induruwa", "Aluthgama", "Beruwala", "Dodanduwa",
            "Habaraduwa", "Talpe", "Weligama", "Mirissa", "Matara", "Kamburugamuwa", "Neluwa", "Nagoda",
            "Pitigala", "Imaduwa", "Thawalama", "Wanduramba", "Akmeemana")
            .forEach(town -> map.put(town, "Galle"));
        
        // Gampaha District
        Arrays.asList("Gampaha", "Negombo", "Katunayake", "Wattala", "Kelaniya", "Peliyagoda", "Ja-Ela", "Kandana", "Minuwangoda", "Divulapitiya",
            "Seeduwa", "Liyanagemulla", "Kochchikade", "Marawila", "Chilaw", "Nattandiya", "Dankotuwa", "Wennappuwa",
            "Veyangoda", "Mirigama", "Kirindiwela", "Dompe", "Kadawatha", "Ragama", "Kiribathgoda", "Attanagalla",
            "Biyagama", "Mahara", "Weliweriya", "Ganemulla", "Yakkala", "Nittambuwa", "Pugoda")
            .forEach(town -> map.put(town, "Gampaha"));
        
        // Hambantota District
        Arrays.asList("Hambantota", "Tangalle", "Tissamaharama", "Ambalantota", "Beliatta", "Weeraketiya", "Suriyawewa", "Kataragama",
            "Mattala", "Kirinda", "Yala", "Bundala", "Sooriyawewa", "Lunugamvehera", "Ranna", "Rekawa",
            "Palatupana", "Wirawila", "Angunukolapelessa", "Embilipitiya", "Middeniya", "Okewela", "Walasmulla",
            "Ambalantota Town", "Nonagama", "Gonnoruwa", "Ridiyagama")
            .forEach(town -> map.put(town, "Hambantota"));
        
        // Jaffna District
        Arrays.asList("Jaffna", "Nallur", "Chavakachcheri", "Point Pedro", "Karainagar", "Velanai", "Kayts", "Delft",
            "Kopay", "Kondavil", "Tellippalai", "Sandilipay", "Uduvil", "Manipay", "Atchuvely", "Ariyalai",
            "Palaly", "Kankesanturai", "Valikamam", "Thenmaradchy", "Vadamaradchy", "Pachchilaipalli",
            "Karaveddy", "Nelliady", "Chankanai", "Maruthankerny", "Puttur", "Thondaimanaru")
            .forEach(town -> map.put(town, "Jaffna"));
        
        // Kalutara District
        Arrays.asList("Kalutara", "Panadura", "Horana", "Beruwala", "Aluthgama", "Matugama", "Bandaragama", "Ingiriya",
            "Wadduwa", "Payagala", "Maggona", "Bulathsinhala", "Palindanuwara", "Agalawatta", "Mathugama",
            "Dharga Town", "Kalutara South", "Kalutara North", "Katukurunda", "Waskaduwa", "Bentota",
            "Kosgama", "Millewa", "Dodangoda", "Welegoda")
            .forEach(town -> map.put(town, "Kalutara"));
        
        // Kandy District
        Arrays.asList("Kandy", "Gampola", "Nawalapitiya", "Wattegama", "Kadugannawa", "Peradeniya", "Katugastota", "Akurana",
            "Digana", "Teldeniya", "Kundasale", "Deltota", "Harispattuwa", "Hataraliyadda", "Medadumbara",
            "Panvila", "Pasbage", "Pathadumbara", "Patha Hewaheta", "Pilimathalawa", "Poojapitiya", "Tumpane",
            "Udadumbara", "Udapalatha", "Udunuwara", "Yatinuwara", "Doluwa", "Gangawata Korale")
            .forEach(town -> map.put(town, "Kandy"));
        
        // Kegalle District
        Arrays.asList("Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Galigamuwa", "Yatiyantota", "Dehiowita", "Ruwanwella",
            "Kitulgala", "Aranayaka", "Bulathkohupitiya", "Deraniyagala", "Kuruppuarachchi", "Polgampola",
            "Ruwanwella Town", "Kegalle Town", "Avissawella", "Ratnapura", "Pelmadulla")
            .forEach(town -> map.put(town, "Kegalle"));
        
        // Kilinochchi District
        Arrays.asList("Kilinochchi", "Paranthan", "Poonakary", "Pallai", "Kandavalai",
            "Akkarayankulam", "Paranthan Junction", "Elephant Pass", "Muhamalai", "Vishvamadu",
            "Kilinochchi Town", "Uruthirapuram", "Karachchi", "Pachchilaipalli")
            .forEach(town -> map.put(town, "Kilinochchi"));
        
        // Kurunegala District
        Arrays.asList("Kurunegala", "Kuliyapitiya", "Narammala", "Wariyapola", "Pannala", "Melsiripura", "Giriulla", "Polgahawela",
            "Alawwa", "Bingiriya", "Bamunakotuwa", "Ganewatta", "Hettipola", "Ibbagamuwa", "Kobeigane",
            "Maho", "Nikaweratiya", "Panduwasnuwara", "Polpithigama", "Rideegama", "Udubaddawa", "Weerambugedara",
            "Maspotha", "Ambanpola", "Bowatenna", "Ehetuwewa", "Galagedera")
            .forEach(town -> map.put(town, "Kurunegala"));
        
        // Mannar District
        Arrays.asList("Mannar", "Murunkan", "Madhu", "Nanattan", "Pesalai",
            "Mannar Island", "Talaimannar", "Erukkalampiddy", "Adampan", "Vidattaltivu",
            "Nanaddan", "Silavathurai", "Manthai West", "Musali", "Mannar Town")
            .forEach(town -> map.put(town, "Mannar"));
        
        // Matale District
        Arrays.asList("Matale", "Dambulla", "Sigiriya", "Galewela", "Ukuwela", "Rattota", "Pallepola", "Nalanda",
            "Laggala", "Wilgamuwa", "Yatawatta", "Ambanganga Korale", "Laggala-Pallegama", "Matale Four Gravets",
            "Kekirawa", "Habarana", "Matale Town", "Aluvihare", "Palapathwela", "Knuckles Range",
            "Riverston", "Illukkumbura", "Elkaduwa")
            .forEach(town -> map.put(town, "Matale"));
        
        // Matara District
        Arrays.asList("Matara", "Weligama", "Mirissa", "Dikwella", "Hakmana", "Akuressa", "Devinuwara", "Kotapola",
            "Kamburugamuwa", "Thihagoda", "Malimbada", "Pitabeddara", "Kirinda", "Matara Four Gravets",
            "Gandara", "Pasgoda", "Kekanadura", "Matara Town", "Dondra", "Polhena", "Nilwala",
            "Madiha", "Kokawala", "Kirinda Puhulwella")
            .forEach(town -> map.put(town, "Matara"));
        
        // Monaragala District
        Arrays.asList("Monaragala", "Wellawaya", "Kataragama", "Buttala", "Medagama", "Thanamalwila", "Bibila", "Badalkumbura",
            "Siyambalanduwa", "Sevanagala", "Madulla", "Moneragala Town", "Bibile", "Okkampitiya", "Hurigaswewa",
            "Dehiattakandiya", "Galabedda", "Kandaketiya", "Koombiyakanda", "Rotawewa", "Yakkalamulla")
            .forEach(town -> map.put(town, "Monaragala"));
        
        // Mullaitivu District
        Arrays.asList("Mullaitivu", "Oddusuddan", "Puthukudiyiruppu", "Manthai East", "Weli Oya",
            "Thunukkai", "Puthukkudiyiruppu", "Mullaitivu Town", "Kokkilai", "Nayaru",
            "Kokkuthoduvai", "Ampalavanpokkanai", "Oddusudan", "Maritimepattu", "Pudukudiyiruppu")
            .forEach(town -> map.put(town, "Mullaitivu"));
        
        // Nuwara Eliya District
        Arrays.asList("Nuwara Eliya", "Hatton", "Maskeliya", "Talawakele", "Ginigathhena", "Walapane", "Kotagala", "Dayagama",
            "Bogawantalawa", "Lindula", "Agarapathana", "Hanguranketha", "Kotmale", "Ramboda", "Nanu Oya",
            "Pussellawa", "Norton Bridge", "Watawala", "Dickoya", "Nawalapitiya", "Ragala", "Haggala",
            "Labukele", "Pedro", "Kandapola", "Radella", "Rikillagaskada")
            .forEach(town -> map.put(town, "Nuwara Eliya"));
        
        // Polonnaruwa District
        Arrays.asList("Polonnaruwa", "Kaduruwela", "Medirigiriya", "Hingurakgoda", "Dimbulagala", "Lankapura", "Welikanda",
            "Elahera", "Thamankaduwa", "Polonnaruwa New Town", "Polonnaruwa Ancient City", "Aralaganwila",
            "Bakamuna", "Manampitiya", "Somawathiya", "Bendiyawewa", "Jayanthipura", "Giritale",
            "Minneriya", "Habarana", "Sigiriya", "Kalyanapura")
            .forEach(town -> map.put(town, "Polonnaruwa"));
        
        // Puttalam District
        Arrays.asList("Puttalam", "Chilaw", "Nattandiya", "Wennappuwa", "Dankotuwa", "Marawila", "Anamaduwa", "Kalpitiya",
            "Mundel", "Noraicholai", "Palavi", "Puttalam Lagoon", "Madampe", "Udappuwa", "Bangadeniya",
            "Bolawatta", "Madhu Road", "Karuwalagaswewa", "Nawagattegama", "Mahawewa", "Eluvankulama",
            "Wilpattu", "Kala Wewa", "Puttalam Town")
            .forEach(town -> map.put(town, "Puttalam"));
        
        // Ratnapura District
        Arrays.asList("Ratnapura", "Embilipitiya", "Balangoda", "Pelmadulla", "Eheliyagoda", "Kuruwita", "Godakawela", "Kalawana",
            "Rakwana", "Nivitigala", "Kahawatta", "Weligepola", "Ayagama", "Imbulpe", "Kolonna", "Opanayaka",
            "Palmadulla", "Ratnapura Town", "Kiriella", "Elapatha", "Palindanuwara", "Malimboda")
            .forEach(town -> map.put(town, "Ratnapura"));
        
        // Trincomalee District
        Arrays.asList("Trincomalee", "Kinniya", "Mutur", "Kantale", "China Bay", "Nilaveli", "Kuchchaveli",
            "Gomarankadawala", "Morawewa", "Seruwila", "Padavi Siripura", "Thambalagamuwa", "Somawathiya",
            "Trincomalee Town", "Fort Frederick", "Uppuveli", "Pigeon Island", "Marble Beach",
            "Verugal", "Pulmoddai", "Kalkudah", "Muttur")
            .forEach(town -> map.put(town, "Trincomalee"));
        
        // Vavuniya District
        Arrays.asList("Vavuniya", "Cheddikulam", "Settikulam", "Nedunkeni", "Omanthai",
            "Vavuniya South", "Vavuniya North", "Venkalacheddikulam", "Puliyankulama", "Kebitigollewa",
            "Horowupotana", "Medawachchiya", "Vavuniya Town", "Thandikulam", "Nellikulama")
            .forEach(town -> map.put(town, "Vavuniya"));
    }

    private List<String> getAllWesternProvinceTowns() {
        return Arrays.asList(
            // Colombo District
            "Colombo", "Sri Jayawardenepura Kotte", "Dehiwala-Mount Lavinia", "Moratuwa", "Kesbewa", 
            "Maharagama", "Kotikawatta", "Mulleriyawa", "Rajagiriya", "Battaramulla", "Kottawa", 
            "Pannipitiya", "Homagama", "Padukka", "Hanwella", "Avissawella", "Nugegoda", 
            "Boralesgamuwa", "Piliyandala", "Kelaniya", "Wattala", "Ja-Ela", "Kandana", "Negombo",
            "Katunayake", "Seeduwa", "Kadawatha", "Ragama", "Kiribathgoda", "Kolonnawa", "Kotte", 
            "Malabe", "Athurugiriya", "Thalawathugoda", "Godagama", "Rathmalana", "Kalubowila", 
            "Rawathawatte",
            // Gampaha District
            "Gampaha", "Minuwangoda", "Divulapitiya", "Liyanagemulla", "Kochchikade", "Marawila", 
            "Chilaw", "Nattandiya", "Dankotuwa", "Wennappuwa", "Veyangoda", "Mirigama", "Kirindiwela", 
            "Dompe", "Attanagalla", "Biyagama", "Mahara", "Weliweriya", "Ganemulla", "Yakkala", 
            "Nittambuwa", "Pugoda", "Peliyagoda",
            // Kalutara District
            "Kalutara", "Panadura", "Horana", "Beruwala", "Aluthgama", "Matugama", "Bandaragama", 
            "Ingiriya", "Wadduwa", "Payagala", "Maggona", "Bulathsinhala", "Palindanuwara", 
            "Agalawatta", "Mathugama", "Dharga Town", "Kalutara South", "Kalutara North", 
            "Katukurunda", "Waskaduwa", "Bentota", "Kosgama", "Millewa", "Dodangoda", "Welegoda"
        );
    }

    private List<String> getAllSouthernProvinceTowns() {
        return Arrays.asList(
            // Galle District
            "Galle", "Hikkaduwa", "Ambalangoda", "Bentota", "Elpitiya", "Karapitiya", "Baddegama", 
            "Yakkalamulla", "Unawatuna", "Kosgoda", "Balapitiya", "Ahungalla", "Induruwa", 
            "Aluthgama", "Beruwala", "Dodanduwa", "Habaraduwa", "Talpe", "Weligama", "Mirissa", 
            "Matara", "Kamburugamuwa", "Neluwa", "Nagoda", "Pitigala", "Imaduwa", "Thawalama", 
            "Wanduramba", "Akmeemana",
            // Matara District
            "Matara", "Weligama", "Mirissa", "Dikwella", "Hakmana", "Akuressa", "Devinuwara", 
            "Kotapola", "Kamburugamuwa", "Thihagoda", "Malimbada", "Pitabeddara", "Kirinda", 
            "Matara Four Gravets", "Gandara", "Pasgoda", "Kekanadura", "Matara Town", "Dondra", 
            "Polhena", "Nilwala", "Madiha", "Kokawala", "Kirinda Puhulwella",
            // Hambantota District
            "Hambantota", "Tangalle", "Tissamaharama", "Ambalantota", "Beliatta", "Weeraketiya", 
            "Suriyawewa", "Kataragama", "Mattala", "Kirinda", "Yala", "Bundala", "Sooriyawewa", 
            "Lunugamvehera", "Ranna", "Rekawa", "Palatupana", "Wirawila", "Angunukolapelessa", 
            "Embilipitiya", "Middeniya", "Okewela", "Walasmulla", "Ambalantota Town", "Nonagama", 
            "Gonnoruwa", "Ridiyagama"
        );
    }

    private List<String> getAllSriLankaTowns() {
        return Arrays.asList(
            // Ampara District (27 towns)
            "Ampara", "Akkaraipattu", "Kalmunai", "Sammanthurai", "Uhana", "Mahaoya", "Damana", "Lahugala",
            "Addalachchenai", "Thirukkovil", "Pottuvil", "Arugam Bay", "Komari", "Navithanveli", "Padiyathalawa",
            "Maha Oya", "Digamadulla", "Dehiattakandiya", "Ampara Town", "Sainthamaruthu", "Nindavur",
            "Kondavil", "Kiran", "Maharagama", "Rugam", "Panama", "Oluvil",
            
            // Anuradhapura District (28 towns)
            "Anuradhapura", "Kekirawa", "Thambuttegama", "Eppawala", "Galenbindunuwewa", "Mihintale", "Medawachchiya", "Rambewa",
            "Tambuttegama", "Horowpothana", "Kahatagasdigiliya", "Rajanganaya", "Palugaswewa", "Galnewa", "Palagala",
            "Tirappane", "Nochchiyagama", "Maradankadawala", "Talawa", "Ipalogama", "Nachchaduwa", "Kebithigollewa",
            "Padaviya", "Galkadawala", "Bogahawewa", "Thirappane", "Habarana", "Iranmadu",
            
            // Badulla District (28 towns)
            "Badulla", "Bandarawela", "Ella", "Haputale", "Welimada", "Mahiyanganaya", "Passara", "Hali Ela",
            "Diyathalawa", "Demodara", "Kandapola", "Namunukula", "Soranathota", "Haputhale", "Idalgashinna",
            "Ohiya", "Ambewela", "Poonagala", "Haldummulla", "Lunugala", "Rideegama", "Meegahakivula",
            "Uva Paranagama", "Ella Gap", "Badulla Town", "Kinchigune", "Keppetipola", "Bellhuloya",
            
            // Batticaloa District (26 towns)
            "Batticaloa", "Kattankudy", "Eravur", "Valachchenai", "Chenkalady", "Oddamavadi", "Kaluwanchikudy",
            "Kiran", "Manmunai North", "Manmunai South", "Manmunai Pattu", "Koralaipattu North", "Koralaipattu",
            "Porativu Pattu", "Unnichchai", "Paddippalai", "Kalkudah", "Passikudah", "Kokkaddicholai",
            "Araipattai", "Vellaveli", "Amirabad", "Navatkadu", "Kodukamam", "Mahiladithivu", "Kirimechchiya",
            
            // Colombo District (47 towns)
            "Colombo", "Sri Jayawardenepura Kotte", "Dehiwala-Mount Lavinia", "Moratuwa", "Kesbewa", "Maharagama", "Kotikawatta", "Mulleriyawa",
            "Rajagiriya", "Battaramulla", "Kottawa", "Pannipitiya", "Homagama", "Padukka", "Hanwella", "Avissawella",
            "Nugegoda", "Boralesgamuwa", "Piliyandala", "Kelaniya", "Wattala", "Ja-Ela", "Kandana", "Negombo",
            "Katunayake", "Seeduwa", "Minuwangoda", "Gampaha", "Veyangoda", "Mirigama", "Kirindiwela", "Dompe",
            "Kadawatha", "Ragama", "Kiribathgoda", "Delkanda", "Wellampitiya", "Kolonnawa", "Kotte", "Malabe",
            "Athurugiriya", "Thalawathugoda", "Godagama", "Rathmalana", "Kalubowila", "Rawathawatte", "Dehiwala",
            
            // Galle District (29 towns)
            "Galle", "Hikkaduwa", "Ambalangoda", "Bentota", "Elpitiya", "Karapitiya", "Baddegama", "Yakkalamulla",
            "Unawatuna", "Kosgoda", "Balapitiya", "Ahungalla", "Induruwa", "Aluthgama", "Beruwala", "Dodanduwa",
            "Habaraduwa", "Talpe", "Weligama", "Mirissa", "Matara", "Kamburugamuwa", "Neluwa", "Nagoda",
            "Pitigala", "Imaduwa", "Thawalama", "Wanduramba", "Akmeemana",
            
            // Gampaha District (33 towns)
            "Gampaha", "Negombo", "Katunayake", "Wattala", "Kelaniya", "Peliyagoda", "Ja-Ela", "Kandana", "Minuwangoda", "Divulapitiya",
            "Seeduwa", "Liyanagemulla", "Kochchikade", "Marawila", "Chilaw", "Nattandiya", "Dankotuwa", "Wennappuwa",
            "Veyangoda", "Mirigama", "Kirindiwela", "Dompe", "Kadawatha", "Ragama", "Kiribathgoda", "Attanagalla",
            "Biyagama", "Mahara", "Weliweriya", "Ganemulla", "Yakkala", "Nittambuwa", "Pugoda",
            
            // Hambantota District (27 towns)
            "Hambantota", "Tangalle", "Tissamaharama", "Ambalantota", "Beliatta", "Weeraketiya", "Suriyawewa", "Kataragama",
            "Mattala", "Kirinda", "Yala", "Bundala", "Sooriyawewa", "Lunugamvehera", "Ranna", "Rekawa",
            "Palatupana", "Wirawila", "Angunukolapelessa", "Embilipitiya", "Middeniya", "Okewela", "Walasmulla",
            "Ambalantota Town", "Nonagama", "Gonnoruwa", "Ridiyagama",
            
            // Jaffna District (28 towns)
            "Jaffna", "Nallur", "Chavakachcheri", "Point Pedro", "Karainagar", "Velanai", "Kayts", "Delft",
            "Kopay", "Kondavil", "Tellippalai", "Sandilipay", "Uduvil", "Manipay", "Atchuvely", "Ariyalai",
            "Palaly", "Kankesanturai", "Valikamam", "Thenmaradchy", "Vadamaradchy", "Pachchilaipalli",
            "Karaveddy", "Nelliady", "Chankanai", "Maruthankerny", "Puttur", "Thondaimanaru",
            
            // Kalutara District (25 towns)
            "Kalutara", "Panadura", "Horana", "Beruwala", "Aluthgama", "Matugama", "Bandaragama", "Ingiriya",
            "Wadduwa", "Payagala", "Maggona", "Bulathsinhala", "Palindanuwara", "Agalawatta", "Mathugama",
            "Dharga Town", "Kalutara South", "Kalutara North", "Katukurunda", "Waskaduwa", "Bentota",
            "Kosgama", "Millewa", "Dodangoda", "Welegoda",
            
            // Kandy District (28 towns)
            "Kandy", "Gampola", "Nawalapitiya", "Wattegama", "Kadugannawa", "Peradeniya", "Katugastota", "Akurana",
            "Digana", "Teldeniya", "Kundasale", "Deltota", "Harispattuwa", "Hataraliyadda", "Medadumbara",
            "Panvila", "Pasbage", "Pathadumbara", "Patha Hewaheta", "Pilimathalawa", "Poojapitiya", "Tumpane",
            "Udadumbara", "Udapalatha", "Udunuwara", "Yatinuwara", "Doluwa", "Gangawata Korale",
            
            // Kegalle District (19 towns)
            "Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Galigamuwa", "Yatiyantota", "Dehiowita", "Ruwanwella",
            "Kitulgala", "Aranayaka", "Bulathkohupitiya", "Deraniyagala", "Kuruppuarachchi", "Polgampola",
            "Ruwanwella Town", "Kegalle Town", "Avissawella", "Ratnapura", "Pelmadulla",
            
            // Kilinochchi District (14 towns)
            "Kilinochchi", "Paranthan", "Poonakary", "Pallai", "Kandavalai",
            "Akkarayankulam", "Paranthan Junction", "Elephant Pass", "Muhamalai", "Vishvamadu",
            "Kilinochchi Town", "Uruthirapuram", "Karachchi", "Pachchilaipalli",
            
            // Kurunegala District (27 towns)
            "Kurunegala", "Kuliyapitiya", "Narammala", "Wariyapola", "Pannala", "Melsiripura", "Giriulla", "Polgahawela",
            "Alawwa", "Bingiriya", "Bamunakotuwa", "Ganewatta", "Hettipola", "Ibbagamuwa", "Kobeigane",
            "Maho", "Nikaweratiya", "Panduwasnuwara", "Polpithigama", "Rideegama", "Udubaddawa", "Weerambugedara",
            "Maspotha", "Ambanpola", "Bowatenna", "Ehetuwewa", "Galagedera",
            
            // Mannar District (15 towns)
            "Mannar", "Murunkan", "Madhu", "Nanattan", "Pesalai",
            "Mannar Island", "Talaimannar", "Erukkalampiddy", "Adampan", "Vidattaltivu",
            "Nanaddan", "Silavathurai", "Manthai West", "Musali", "Mannar Town",
            
            // Matale District (23 towns)
            "Matale", "Dambulla", "Sigiriya", "Galewela", "Ukuwela", "Rattota", "Pallepola", "Nalanda",
            "Laggala", "Wilgamuwa", "Yatawatta", "Ambanganga Korale", "Laggala-Pallegama", "Matale Four Gravets",
            "Kekirawa", "Habarana", "Matale Town", "Aluvihare", "Palapathwela", "Knuckles Range",
            "Riverston", "Illukkumbura", "Elkaduwa",
            
            // Matara District (24 towns)
            "Matara", "Weligama", "Mirissa", "Dikwella", "Hakmana", "Akuressa", "Devinuwara", "Kotapola",
            "Kamburugamuwa", "Thihagoda", "Malimbada", "Pitabeddara", "Kirinda", "Matara Four Gravets",
            "Gandara", "Pasgoda", "Kekanadura", "Matara Town", "Dondra", "Polhena", "Nilwala",
            "Madiha", "Kokawala", "Kirinda Puhulwella",
            
            // Monaragala District (21 towns)
            "Monaragala", "Wellawaya", "Kataragama", "Buttala", "Medagama", "Thanamalwila", "Bibila", "Badalkumbura",
            "Siyambalanduwa", "Sevanagala", "Madulla", "Moneragala Town", "Bibile", "Okkampitiya", "Hurigaswewa",
            "Dehiattakandiya", "Galabedda", "Kandaketiya", "Koombiyakanda", "Rotawewa", "Yakkalamulla",
            
            // Mullaitivu District (15 towns)
            "Mullaitivu", "Oddusuddan", "Puthukudiyiruppu", "Manthai East", "Weli Oya",
            "Thunukkai", "Puthukkudiyiruppu", "Mullaitivu Town", "Kokkilai", "Nayaru",
            "Kokkuthoduvai", "Ampalavanpokkanai", "Oddusudan", "Maritimepattu", "Pudukudiyiruppu",
            
            // Nuwara Eliya District (27 towns)
            "Nuwara Eliya", "Hatton", "Maskeliya", "Talawakele", "Ginigathhena", "Walapane", "Kotagala", "Dayagama",
            "Bogawantalawa", "Lindula", "Agarapathana", "Hanguranketha", "Kotmale", "Ramboda", "Nanu Oya",
            "Pussellawa", "Norton Bridge", "Watawala", "Dickoya", "Nawalapitiya", "Ragala", "Haggala",
            "Labukele", "Pedro", "Kandapola", "Radella", "Rikillagaskada",
            
            // Polonnaruwa District (22 towns)
            "Polonnaruwa", "Kaduruwela", "Medirigiriya", "Hingurakgoda", "Dimbulagala", "Lankapura", "Welikanda",
            "Elahera", "Thamankaduwa", "Polonnaruwa New Town", "Polonnaruwa Ancient City", "Aralaganwila",
            "Bakamuna", "Manampitiya", "Somawathiya", "Bendiyawewa", "Jayanthipura", "Giritale",
            "Minneriya", "Habarana", "Sigiriya", "Kalyanapura",
            
            // Puttalam District (24 towns)
            "Puttalam", "Chilaw", "Nattandiya", "Wennappuwa", "Dankotuwa", "Marawila", "Anamaduwa", "Kalpitiya",
            "Mundel", "Noraicholai", "Palavi", "Puttalam Lagoon", "Madampe", "Udappuwa", "Bangadeniya",
            "Bolawatta", "Madhu Road", "Karuwalagaswewa", "Nawagattegama", "Mahawewa", "Eluvankulama",
            "Wilpattu", "Kala Wewa", "Puttalam Town",
            
            // Ratnapura District (22 towns)
            "Ratnapura", "Embilipitiya", "Balangoda", "Pelmadulla", "Eheliyagoda", "Kuruwita", "Godakawela", "Kalawana",
            "Rakwana", "Nivitigala", "Kahawatta", "Weligepola", "Ayagama", "Imbulpe", "Kolonna", "Opanayaka",
            "Palmadulla", "Ratnapura Town", "Kiriella", "Elapatha", "Palindanuwara", "Malimboda",
            
            // Trincomalee District (22 towns)
            "Trincomalee", "Kinniya", "Mutur", "Kantale", "China Bay", "Nilaveli", "Kuchchaveli",
            "Gomarankadawala", "Morawewa", "Seruwila", "Padavi Siripura", "Thambalagamuwa", "Somawathiya",
            "Trincomalee Town", "Fort Frederick", "Uppuveli", "Pigeon Island", "Marble Beach",
            "Verugal", "Pulmoddai", "Kalkudah", "Muttur",
            
            // Vavuniya District (15 towns)
            "Vavuniya", "Cheddikulam", "Settikulam", "Nedunkeni", "Omanthai",
            "Vavuniya South", "Vavuniya North", "Venkalacheddikulam", "Puliyankulama", "Kebitigollewa",
            "Horowupotana", "Medawachchiya", "Vavuniya Town", "Thandikulam", "Nellikulama"
        );
    }

    @Transactional
    public void seedBanners() {
        log.info("Seeding banners...");
        
        createBanner("/banners/welcome-to-aqualink.jpg");
        createBanner("/banners/fresh-fish-delivery.jpg");
        createBanner("/banners/aquaculture-equipment.jpg");
        
        log.info("✅ Created banners");
    }

    private void createBanner(String imageUrl) {
        Banner banner = new Banner();
        banner.setImageUrl(imageUrl);
        bannerRepository.save(banner);
    }

    @Transactional
    public void seedOrders() {
        long orderCount = orderRepository.count();
        long orderItemCount = orderItemRepository.count();
        
        log.info("📊 Current database state: {} orders, {} order items", orderCount, orderItemCount);
        
        if (orderCount > 0) {
            log.info("⏭️ Orders already exist, skipping...");
            
            // Show existing orders for verification
            List<Order> orders = orderRepository.findAll();
            orders.forEach(order -> {
                log.info("  📦 Order ID: {}, Buyer: {}, Items: {}, Total: {}, Status: {}", 
                    order.getId(), 
                    order.getBuyerUser().getEmail(),
                    order.getOrderItems() != null ? order.getOrderItems().size() : 0,
                    order.getTotalAmount(),
                    order.getOrderStatus());
            });
            return;
        }

        // Get some users for orders - use actual customers created in seedUsers
        User buyer1 = userRepository.findByEmail("nuwan@customer.com").orElse(null);
        User buyer2 = userRepository.findByEmail("samantha@customer.com").orElse(null);

        if (buyer1 == null || buyer2 == null) {
            log.warn("⚠️ Required users not found for orders");
            return;
        }

        // Get some products for order items
        List<Fish> fishes = fishRepository.findAll();
        List<IndustrialStuff> equipment = industrialStuffRepository.findAll();

        if (fishes.isEmpty() && equipment.isEmpty()) {
            log.warn("⚠️ No products found for orders");
            return;
        }

        // Create Order 1 - Fish order
        Order order1 = new Order();
        order1.setBuyerUser(buyer1);
        order1.setOrderDateTime(LocalDateTime.now().minusDays(2));
        order1.setAddressPlace("123/A");
        order1.setAddressStreet("Main Street");
        order1.setAddressDistrict("Colombo");
        order1.setAddressTown("Nugegoda");
        order1.setOrderStatus(Order.OrderStatus.DELIVERY_PENDING);
        order1.setTotalAmount(new java.math.BigDecimal("5500.00"));
        order1 = orderRepository.save(order1);
        
        // Create delivery quote request for order 1
        DeliveryQuoteRequest quoteRequest1 = createDeliveryQuoteRequest(order1.getId());
        
        // Create delivery quote from Dinesh for order 1
        User dinesh = userRepository.findByEmail("dinesh@delivery.com").orElse(null);
        if (dinesh != null) {
            DeliveryQuote quote1 = createDeliveryQuote(quoteRequest1, dinesh, "500.00", LocalDate.now().plusDays(3), "Fast delivery");
            order1.setAcceptedDeliveryQuoteId(quote1.getId());
            orderRepository.save(order1);
            // Add quote request ID to order's list
            order1.setDeliveryQuoteRequestIds(Arrays.asList(quoteRequest1.getId()));
            orderRepository.save(order1);
        }
        
        log.info("✓ Created order 1 for {}", buyer1.getEmail());

        // Create Order Items for Order 1 - Use Sunil's farm products
        User sunil = userRepository.findByEmail("sunil@farm.com").orElse(null);
        if (sunil != null) {
            List<Fish> sunilFishes = fishRepository.findAll().stream()
                .filter(f -> f.getNicNumber().equals(sunil.getNicNumber()))
                .toList();
            
            if (!sunilFishes.isEmpty()) {
                // Add Tilapia from Sunil's farm
                Fish tilapia = sunilFishes.stream()
                    .filter(f -> f.getName().equals("Tilapia"))
                    .findFirst()
                    .orElse(sunilFishes.get(0));
                
                OrderItem item1 = new OrderItem();
                item1.setOrder(order1);
                item1.setProductId(tilapia.getId());
                item1.setProductType("FISH");
                item1.setProductName(tilapia.getName());
                item1.setQuantity(20);
                item1.setPrice(new java.math.BigDecimal("450.00"));
                orderItemRepository.save(item1);
                log.info("  ✓ Added order item: {} x20 from Sunil's farm", tilapia.getName());

                // Add Catfish from Sunil's farm
                if (sunilFishes.size() > 1) {
                    Fish catfish = sunilFishes.stream()
                        .filter(f -> f.getName().equals("Catfish"))
                        .findFirst()
                        .orElse(sunilFishes.get(1));
                    
                    OrderItem item2 = new OrderItem();
                    item2.setOrder(order1);
                    item2.setProductId(catfish.getId());
                    item2.setProductType("FISH");
                    item2.setProductName(catfish.getName());
                    item2.setQuantity(10);
                    item2.setPrice(new java.math.BigDecimal("550.00"));
                    orderItemRepository.save(item2);
                    log.info("  ✓ Added order item: {} x10 from Sunil's farm", catfish.getName());
                }
            }
        }

        // Create Order 2 - Mixed order
        Order order2 = new Order();
        order2.setBuyerUser(buyer2);
        order2.setOrderDateTime(LocalDateTime.now().minusDays(1));
        order2.setAddressPlace("456/B");
        order2.setAddressStreet("Lake Road");
        order2.setAddressDistrict("Gampaha");
        order2.setAddressTown("Kiribathgoda");
        order2.setOrderStatus(Order.OrderStatus.ORDER_PENDING);
        order2.setTotalAmount(new java.math.BigDecimal("8200.00"));
        order2 = orderRepository.save(order2);
        
        // Create delivery quote request for order 2
        DeliveryQuoteRequest quoteRequest2 = createDeliveryQuoteRequest(order2.getId());
        
        // Create delivery quote from Dinesh for order 2
        if (dinesh != null) {
            DeliveryQuote quote2 = createDeliveryQuote(quoteRequest2, dinesh, "750.00", LocalDate.now().plusDays(5), "Standard delivery");
            order2.setAcceptedDeliveryQuoteId(quote2.getId());
            orderRepository.save(order2);
            // Add quote request ID to order's list
            order2.setDeliveryQuoteRequestIds(Arrays.asList(quoteRequest2.getId()));
            orderRepository.save(order2);
        }
        
        log.info("✓ Created order 2 for {}", buyer2.getEmail());

        // Create Order Items for Order 2 - Mixed order with Sunil's fish and industrial items
        if (!equipment.isEmpty()) {
            IndustrialStuff equip1 = equipment.get(0);
            OrderItem item3 = new OrderItem();
            item3.setOrder(order2);
            item3.setProductId(equip1.getId());
            item3.setProductType("INDUSTRIAL");
            item3.setProductName(equip1.getName());
            item3.setQuantity(2);
            item3.setPrice(new java.math.BigDecimal("3500.00"));
            orderItemRepository.save(item3);
            log.info("  ✓ Added order item: {} x2", equip1.getName());
        }

        // Add Carp from Sunil's farm to order 2
        if (sunil != null) {
            List<Fish> sunilFishes = fishRepository.findAll().stream()
                .filter(f -> f.getNicNumber().equals(sunil.getNicNumber()))
                .toList();
            
            Fish carp = sunilFishes.stream()
                .filter(f -> f.getName().equals("Carp"))
                .findFirst()
                .orElse(!sunilFishes.isEmpty() ? sunilFishes.get(0) : null);
            
            if (carp != null) {
                OrderItem item4 = new OrderItem();
                item4.setOrder(order2);
                item4.setProductId(carp.getId());
                item4.setProductType("FISH");
                item4.setProductName(carp.getName());
                item4.setQuantity(5);
                item4.setPrice(new java.math.BigDecimal("650.00"));
                orderItemRepository.save(item4);
                log.info("  ✓ Added order item: {} x5 from Sunil's farm", carp.getName());
            }
        }

        log.info("✅ Created 2 orders with order items");
    }

    private DeliveryQuoteRequest createDeliveryQuoteRequest(Long orderId) {
        DeliveryQuoteRequest request = new DeliveryQuoteRequest();
        request.setOrderId(orderId);
        request.setLastRespondingDateTime(LocalDateTime.now().plusDays(7));
        return deliveryQuoteRequestRepository.save(request);
    }

    private DeliveryQuote createDeliveryQuote(DeliveryQuoteRequest quoteRequest, User deliveryPerson, 
                                              String fee, LocalDate deliveryDate, String notes) {
        DeliveryQuote quote = new DeliveryQuote();
        quote.setQuoteRequest(quoteRequest);
        quote.setDeliveryPerson(deliveryPerson);
        quote.setDeliveryFee(new java.math.BigDecimal(fee));
        quote.setDeliveryDate(deliveryDate);
        quote.setNotes(notes);
        quote.setStatus(DeliveryQuote.QuoteStatus.ACCEPTED);
        quote.setAcceptedAt(LocalDateTime.now());
        quote.setValidUntil(LocalDateTime.now().plusDays(7));
        return deliveryQuoteRepository.save(quote);
    }
}
