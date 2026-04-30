import { startTransition, useEffect, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import homepageImage from "./assets/bookcycle-home.svg";
import marketplaceImage from "./assets/marketplace-shelf.svg";
import messagesImage from "./assets/messages-inbox.svg";
import offersImage from "./assets/offers-desk.svg";
import sellImage from "./assets/sell-listing.svg";
import { endpoints, API_BASE_URL } from "./lib/api";

const emptyRegisterForm = {
  name: "",
  email: "",
  password: "",
  city: "",
  state: "",
};

const emptyLoginForm = {
  email: "",
  password: "",
};

const emptyListingForm = {
  title: "",
  author: "",
  genre: "",
  condition: "GOOD",
  listingType: "SELL",
  price: "",
  city: "",
  state: "",
  description: "",
  images: [],
};

const emptyFilters = {
  search: "",
  city: "",
  genre: "",
  condition: "",
  listingType: "",
  minPrice: "",
  maxPrice: "",
  sort: "createdAt-desc",
};

const emptyOfferForm = {
  type: "BUY",
  price: "",
  rentDays: "",
  swapBookTitle: "",
  message: "",
};

const emptyMessageForm = {
  content: "",
};

const conditionOptions = ["NEW", "LIKE_NEW", "GOOD", "ACCEPTABLE", "POOR"];
const listingTypeOptions = ["SELL", "RENT", "SWAP", "SELL_OR_SWAP", "RENT_OR_SELL"];
const genreOptions = [
  "FICTION",
  "NON_FICTION",
  "SCIENCE",
  "TECHNOLOGY",
  "HISTORY",
  "BIOGRAPHY",
  "SELF_HELP",
  "CHILDREN",
  "FANTASY",
  "MYSTERY",
  "ROMANCE",
  "TEXTBOOK",
  "COMICS",
  "OTHER",
];
const sortOptions = [
  { value: "createdAt-desc", label: "Newest first" },
  { value: "createdAt-asc", label: "Oldest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "views-desc", label: "Most viewed" },
];
const offerTypesByListingType = {
  SELL: ["BUY"],
  RENT: ["RENT"],
  SWAP: ["SWAP"],
  SELL_OR_SWAP: ["BUY", "SWAP"],
  RENT_OR_SELL: ["BUY", "RENT"],
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Field = ({ error, children, className = "" }) => (
  <div className={`field ${error ? "field-invalid" : ""} ${className}`.trim()}>
    {children}
    {error ? <span className="field-error">{error}</span> : null}
  </div>
);

const getTrimmed = (value) => String(value || "").trim();

const formatName = (name, fallback = "Reader") => {
  const cleaned = getTrimmed(name);
  if (!cleaned) return fallback;

  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const getInitial = (name, fallback = "R") => formatName(name, fallback).slice(0, 1).toUpperCase();

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("bookswap-token") || "");
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationUserId, setSelectedConversationUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState("Loading listings...");
  const [authMode, setAuthMode] = useState("register");
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [listingForm, setListingForm] = useState(emptyListingForm);
  const [offerForm, setOfferForm] = useState(emptyOfferForm);
  const [messageForm, setMessageForm] = useState(emptyMessageForm);
  const [authLoading, setAuthLoading] = useState(false);
  const [listingLoading, setListingLoading] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [wishlistLoadingId, setWishlistLoadingId] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerActionLoadingId, setOfferActionLoadingId] = useState("");
  const [conversationLoading, setConversationLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [registerErrors, setRegisterErrors] = useState({});
  const [loginErrors, setLoginErrors] = useState({});
  const [listingErrors, setListingErrors] = useState({});
  const [offerErrors, setOfferErrors] = useState({});
  const [messageErrors, setMessageErrors] = useState({});

  const resetSessionState = () => {
    setUser(null);
    setWishlist([]);
    setWishlistIds([]);
    setSentOffers([]);
    setReceivedOffers([]);
    setConversations([]);
    setMessages([]);
    setUnreadCount(0);
    setSelectedConversationUserId("");
    setToken("");
  };

  useEffect(() => {
    let cancelled = false;

    const fetchListings = async () => {
      setBrowseLoading(true);

      try {
        const [sortBy, order] = filters.sort.split("-");
        const data = await endpoints.getListings({
          search: filters.search,
          city: filters.city,
          genre: filters.genre,
          condition: filters.condition,
          listingType: filters.listingType,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          sortBy,
          order,
        });
        if (cancelled) return;

        setListings(data.listings || []);
        setSelectedListingId((current) => {
          if (!data.listings?.length) {
            return "";
          }

          return data.listings.some((listing) => listing.id === current)
            ? current
            : data.listings[0].id;
        });
        setStatus(
          data.listings?.length
            ? "Latest books available now"
            : "No listings match your filters yet.",
        );
        setError("");
      } catch (err) {
        if (cancelled) return;

        setListings([]);
        setStatus("Could not load listings");
        setError(err.message);
      } finally {
        if (!cancelled) {
          setBrowseLoading(false);
        }
      }
    };

    const timer = window.setTimeout(fetchListings, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filters]);

  useEffect(() => {
    if (!selectedListingId) {
      return;
    }

    let cancelled = false;

    const fetchListingDetail = async () => {
      setDetailLoading(true);

      try {
        const data = await endpoints.getListing(selectedListingId);
        if (cancelled) return;

        setSelectedListing(data.listing);
        setOfferForm((current) => ({
          ...current,
          type: offerTypesByListingType[data.listing.listingType]?.includes(current.type)
            ? current.type
            : offerTypesByListingType[data.listing.listingType]?.[0] || "BUY",
        }));
        setError("");
      } catch (err) {
        if (cancelled) return;

        setSelectedListing(null);
        setError(err.message);
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };

    fetchListingDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedListingId]);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("bookswap-token");
      return;
    }

    localStorage.setItem("bookswap-token", token);

    const loadDashboardData = async () => {
      try {
        const [profileData, wishlistData, sentData, receivedData, inboxData, unreadData] =
          await Promise.all([
            endpoints.me(token),
            endpoints.getWishlist(token),
            endpoints.getSentOffers(token),
            endpoints.getReceivedOffers(token),
            endpoints.getInbox(token),
            endpoints.getUnreadCount(token),
          ]);

        setUser(profileData.user);
        setWishlist(wishlistData.wishlist || []);
        setWishlistIds((wishlistData.wishlist || []).map((listing) => listing.id));
        setSentOffers(sentData.offers || []);
        setReceivedOffers(receivedData.offers || []);
        setConversations(inboxData.conversations || []);
        setUnreadCount(unreadData.unreadCount || 0);
        setSelectedConversationUserId(
          (current) => current || inboxData.conversations?.[0]?.partner?.id || "",
        );
        setListingForm((current) => ({
          ...current,
          city: current.city || profileData.user.city || "",
          state: current.state || profileData.user.state || "",
        }));
        setError("");
      } catch (err) {
        setError(err.message);
        resetSessionState();
      }
    };

    loadDashboardData();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedConversationUserId) {
      return;
    }

    let cancelled = false;

    const loadConversation = async () => {
      setConversationLoading(true);

      try {
        const [conversationData, unreadData] = await Promise.all([
          endpoints.getConversation(token, selectedConversationUserId),
          endpoints.getUnreadCount(token),
        ]);
        if (cancelled) return;

        setMessages(conversationData.messages || []);
        setUnreadCount(unreadData.unreadCount || 0);
        setError("");
      } catch (err) {
        if (cancelled) return;

        setError(err.message);
      } finally {
        if (!cancelled) {
          setConversationLoading(false);
        }
      }
    };

    loadConversation();

    return () => {
      cancelled = true;
    };
  }, [token, selectedConversationUserId]);

  const resolveImageUrl = (src) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) {
      return src;
    }
    return `${API_BASE_URL}${src}`;
  };

  const updateRegisterField = (event) => {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
    setRegisterErrors((current) => ({ ...current, [name]: "" }));
  };

  const updateLoginField = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
    setLoginErrors((current) => ({ ...current, [name]: "" }));
  };

  const updateListingField = (event) => {
    const { name, value } = event.target;
    setListingForm((current) => ({ ...current, [name]: value }));
    setListingErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleListingImagesChange = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5);
    setListingForm((current) => ({ ...current, images: files }));
    setListingErrors((current) => ({ ...current, images: "" }));
  };

  const updateOfferField = (event) => {
    const { name, value } = event.target;
    setOfferForm((current) => ({ ...current, [name]: value }));
    setOfferErrors((current) => ({ ...current, [name]: "" }));
  };

  const updateMessageField = (event) => {
    const { name, value } = event.target;
    setMessageForm((current) => ({ ...current, [name]: value }));
    setMessageErrors((current) => ({ ...current, [name]: "" }));
  };

  const updateFilterField = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const validateRegisterForm = () => {
    const nextErrors = {};

    if (getTrimmed(registerForm.name).length < 2) {
      nextErrors.name = "Enter your full name.";
    }
    if (!emailPattern.test(getTrimmed(registerForm.email))) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (registerForm.password.length < 6) {
      nextErrors.password = "Use at least 6 characters.";
    }
    if (!getTrimmed(registerForm.city)) {
      nextErrors.city = "City is required.";
    }
    if (!getTrimmed(registerForm.state)) {
      nextErrors.state = "State is required.";
    }

    return nextErrors;
  };

  const validateLoginForm = () => {
    const nextErrors = {};

    if (!emailPattern.test(getTrimmed(loginForm.email))) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!loginForm.password) {
      nextErrors.password = "Password is required.";
    }

    return nextErrors;
  };

  const validateListingForm = () => {
    const nextErrors = {};

    if (!getTrimmed(listingForm.title)) {
      nextErrors.title = "Book title is required.";
    }
    if (!getTrimmed(listingForm.author)) {
      nextErrors.author = "Author is required.";
    }
    if (!listingForm.genre) {
      nextErrors.genre = "Choose a genre so readers can filter it.";
    }
    if (listingForm.price && Number(listingForm.price) < 0) {
      nextErrors.price = "Price cannot be negative.";
    }
    if (!getTrimmed(listingForm.city)) {
      nextErrors.city = "City is required.";
    }
    if (!getTrimmed(listingForm.state)) {
      nextErrors.state = "State is required.";
    }
    if (listingForm.description.length > 800) {
      nextErrors.description = "Keep the description under 800 characters.";
    }
    if ((listingForm.images || []).length > 5) {
      nextErrors.images = "Upload up to 5 images.";
    }

    return nextErrors;
  };

  const validateOfferForm = () => {
    const nextErrors = {};

    if (offerForm.type === "BUY") {
      const price = Number(offerForm.price);
      if (!offerForm.price || !Number.isFinite(price) || price <= 0) {
        nextErrors.price = "Enter an offer price greater than 0.";
      }
    }
    if (offerForm.type === "RENT") {
      const rentDays = Number(offerForm.rentDays);
      if (!offerForm.rentDays || !Number.isInteger(rentDays) || rentDays < 1) {
        nextErrors.rentDays = "Enter at least 1 rent day.";
      }
    }
    if (offerForm.type === "SWAP" && !getTrimmed(offerForm.swapBookTitle)) {
      nextErrors.swapBookTitle = "Enter the book you want to swap.";
    }
    if (offerForm.message.length > 400) {
      nextErrors.message = "Keep the message under 400 characters.";
    }

    return nextErrors;
  };

  const validateMessageForm = () => {
    const nextErrors = {};
    const content = getTrimmed(messageForm.content);

    if (!content) {
      nextErrors.content = "Write a message before sending.";
    } else if (content.length > 1000) {
      nextErrors.content = "Keep the message under 1000 characters.";
    }

    return nextErrors;
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegisterForm();
    setRegisterErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    setAuthLoading(true);
    setError("");

    try {
      const data = await endpoints.register(registerForm);
      setToken(data.token);
      setRegisterForm(emptyRegisterForm);
      setRegisterErrors({});
      setStatus("Welcome! Your account is now active.");
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const nextErrors = validateLoginForm();
    setLoginErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    setAuthLoading(true);
    setError("");

    try {
      const data = await endpoints.login(loginForm);
      setToken(data.token);
      setLoginForm(emptyLoginForm);
      setLoginErrors({});
      setStatus("Welcome back! Your account is ready.");
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateListing = async (event) => {
    event.preventDefault();
    const nextErrors = validateListingForm();
    setListingErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    setListingLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", listingForm.title);
      formData.append("author", listingForm.author);
      formData.append("genre", listingForm.genre || "");
      formData.append("condition", listingForm.condition);
      formData.append("listingType", listingForm.listingType);
      formData.append("price", listingForm.price || "");
      formData.append("city", listingForm.city);
      formData.append("state", listingForm.state);
      formData.append("description", listingForm.description || "");

      (listingForm.images || []).forEach((file) => {
        if (file) {
          formData.append("images", file);
        }
      });

      const created = await endpoints.createListing(token, formData);
      setListingForm({
        ...emptyListingForm,
        city: user?.city || "",
        state: user?.state || "",
      });
      setListingErrors({});
      setFilters((current) => ({ ...current }));
      setSelectedListingId(created.listing.id);
      setStatus("Your listing is live and ready for other readers.");
    } catch (err) {
      setError(err.message);
    } finally {
      setListingLoading(false);
    }
  };

  const handleLogout = () => {
    startTransition(() => {
      setListingForm(emptyListingForm);
      setOfferForm(emptyOfferForm);
      setMessageForm(emptyMessageForm);
      resetSessionState();
      setStatus("Logged out locally. Public listings are still available.");
    });
  };

  const activeFilterTags = [
    filters.search && `Search: "${filters.search}"`,
    filters.city && `City: ${filters.city}`,
    filters.genre && `Genre: ${filters.genre.replaceAll("_", " ")}`,
    filters.condition && `Condition: ${filters.condition.replaceAll("_", " ")}`,
    filters.listingType && `Type: ${filters.listingType.replaceAll("_", " ")}`,
    filters.minPrice && `Min ₹${filters.minPrice}`,
    filters.maxPrice && `Max ₹${filters.maxPrice}`,
  ].filter(Boolean);

  const clearFilters = () => {
    setFilters(emptyFilters);
  };

  const openListingDetail = (listingId) => {
    setSelectedListingId(listingId);
  };

  const refreshOfferState = async (sessionToken) => {
    const [sentData, receivedData] = await Promise.all([
      endpoints.getSentOffers(sessionToken),
      endpoints.getReceivedOffers(sessionToken),
    ]);
    setSentOffers(sentData.offers || []);
    setReceivedOffers(receivedData.offers || []);
  };

  const refreshMessagingState = async (
    sessionToken,
    nextConversationUserId = selectedConversationUserId,
  ) => {
    const [inboxData, unreadData] = await Promise.all([
      endpoints.getInbox(sessionToken),
      endpoints.getUnreadCount(sessionToken),
    ]);

    setConversations(inboxData.conversations || []);
    setUnreadCount(unreadData.unreadCount || 0);

    const conversationUserId =
      nextConversationUserId || inboxData.conversations?.[0]?.partner?.id || "";

    setSelectedConversationUserId(conversationUserId);

    if (conversationUserId) {
      const conversationData = await endpoints.getConversation(sessionToken, conversationUserId);
      setMessages(conversationData.messages || []);
    } else {
      setMessages([]);
    }
  };

  const isWishlisted = (listingId) => wishlistIds.includes(listingId);

  const handleToggleWishlist = async (listingId, event) => {
    event?.stopPropagation();

    if (!token) {
      setError("Login first to save books to your wishlist.");
      return;
    }

    setWishlistLoadingId(listingId);
    setError("");

    try {
      const result = await endpoints.toggleWishlist(token, listingId);
      const nextWishlist = await endpoints.getWishlist(token);
      setWishlist(nextWishlist.wishlist || []);
      setWishlistIds((nextWishlist.wishlist || []).map((listing) => listing.id));
      setStatus(result.wishlisted ? "Book added to wishlist." : "Book removed from wishlist.");
    } catch (err) {
      setError(err.message);
    } finally {
      setWishlistLoadingId("");
    }
  };

  const handleOfferSubmit = async (event) => {
    event.preventDefault();

    if (!token || !visibleSelectedListing) {
      setError("Login and choose a listing before making an offer.");
      return;
    }

    const nextErrors = validateOfferForm();
    setOfferErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    setOfferLoading(true);
    setError("");

    try {
      await endpoints.createOffer(token, {
        listingId: visibleSelectedListing.id,
        type: offerForm.type,
        price: offerForm.price ? Number(offerForm.price) : null,
        rentDays: offerForm.rentDays ? Number(offerForm.rentDays) : null,
        swapBookTitle: offerForm.swapBookTitle,
        message: offerForm.message,
      });
      await refreshOfferState(token);
      setOfferForm({
        ...emptyOfferForm,
        type: offerTypesByListingType[visibleSelectedListing.listingType]?.[0] || "BUY",
      });
      setOfferErrors({});
      setStatus("Offer sent successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setOfferLoading(false);
    }
  };

  const handleRespondToOffer = async (offerId, nextStatus) => {
    if (!token) {
      return;
    }

    setOfferActionLoadingId(offerId);
    setError("");

    try {
      await endpoints.respondToOffer(token, offerId, nextStatus);
      await refreshOfferState(token);
      if (selectedListingId) {
        const data = await endpoints.getListing(selectedListingId);
        setSelectedListing(data.listing);
      }
      setStatus(`Offer ${nextStatus.toLowerCase()} successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setOfferActionLoadingId("");
    }
  };

  const handleOpenSellerConversation = () => {
    if (!visibleSelectedListing?.seller?.id || !token) {
      setError("Login first to message the seller.");
      return;
    }

    setSelectedConversationUserId(visibleSelectedListing.seller.id);
    setStatus(`Conversation opened with ${formatName(visibleSelectedListing.seller.name)}.`);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!token || !selectedConversationUserId) {
      setError("Choose a conversation before sending a message.");
      return;
    }

    const nextErrors = validateMessageForm();
    setMessageErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    setMessageLoading(true);
    setError("");

    try {
      await endpoints.sendMessage(token, {
        receiverId: selectedConversationUserId,
        content: messageForm.content,
        listingId:
          visibleSelectedListing?.seller?.id === selectedConversationUserId
            ? visibleSelectedListing.id
            : null,
      });
      setMessageForm(emptyMessageForm);
      setMessageErrors({});
      await refreshMessagingState(token, selectedConversationUserId);
      setStatus("Message sent successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setMessageLoading(false);
    }
  };

  const visibleSelectedListing =
    selectedListingId && selectedListing?.id === selectedListingId ? selectedListing : null;
  const offerTypeOptions = visibleSelectedListing
    ? offerTypesByListingType[visibleSelectedListing.listingType] || ["BUY"]
    : ["BUY"];
  const canMakeOffer =
    user &&
    visibleSelectedListing &&
    user.id !== visibleSelectedListing.seller.id &&
    visibleSelectedListing.isAvailable;
  const selectedConversation = conversations.find(
    (conversation) => conversation.partner.id === selectedConversationUserId,
  );
  const listingCount = listings.length;
  const wishlistCount = wishlist.length;
  const offerCount = sentOffers.length + receivedOffers.length;
  const pendingReceivedCount = receivedOffers.filter((offer) => offer.status === "PENDING").length;
  const acceptedOfferCount = [...sentOffers, ...receivedOffers].filter(
    (offer) => offer.status === "ACCEPTED",
  ).length;

  const renderOfferCard = (offer, direction) => {
    const contact = direction === "sent" ? offer.seller : offer.buyer;
    const thumbnail = offer.listing?.images?.[0];
    const statusClass = offer.status?.toLowerCase() || "pending";

    return (
      <article key={offer.id} className="offer-item">
        <div className="offer-thumb">
          {thumbnail ? (
            <img src={resolveImageUrl(thumbnail)} alt={offer.listing.title} />
          ) : (
            <span>{offer.listing.title?.slice(0, 1)?.toUpperCase() || "B"}</span>
          )}
        </div>
        <div className="offer-card-body">
          <div className="offer-card-topline">
            <span className={`offer-status ${statusClass}`}>{offer.status}</span>
            <span>{offer.type}</span>
          </div>
          <h3>{offer.listing.title}</h3>
          <p>
            {direction === "sent" ? "Sent to" : "From"} {formatName(contact?.name)}
            {contact?.city ? `, ${contact.city}` : ""}
          </p>
          <div className="offer-card-meta">
            {offer.price ? <span>Rs {offer.price}</span> : null}
            {offer.rentDays ? <span>{offer.rentDays} day rent</span> : null}
            {offer.swapBookTitle ? <span>Swap: {offer.swapBookTitle}</span> : null}
          </div>
          {offer.message ? <p className="offer-message">{offer.message}</p> : null}
          {direction === "received" && offer.status === "PENDING" ? (
            <div className="offer-actions">
              <button type="button" className="primary-button small" onClick={() => handleRespondToOffer(offer.id, "ACCEPTED")} disabled={offerActionLoadingId === offer.id}>
                Accept
              </button>
              <button type="button" className="secondary-button small" onClick={() => handleRespondToOffer(offer.id, "REJECTED")} disabled={offerActionLoadingId === offer.id}>
                Reject
              </button>
            </div>
          ) : null}
        </div>
      </article>
    );
  };

  const navItems = [
    {
      to: "/",
      label: "Home",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 11.5 12 5l8 6.5V20H5v-8.5z" />
          <path d="M9 20v-6h6v6" />
        </svg>
      ),
    },
    {
      to: "/marketplace",
      label: "Marketplace",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 4a2 2 0 0 0-2 2v14h16V6a2 2 0 0 0-2-2H6z" />
          <path d="M6 6h12v12H6V6zm2 2v2h8V8H8zm0 4v2h8v-2H8z" />
        </svg>
      ),
    },
    {
      to: "/offers",
      label: "Offers",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4h10l4 4v10a2 2 0 0 1-2 2H7l-4-4V6a2 2 0 0 1 2-2z" />
          <path d="M9 9h6" />
          <circle cx="15" cy="15" r="2" />
        </svg>
      ),
    },
    {
      to: "/messages",
      label: "Messages",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h16v12H7.5L4 19.5V4z" />
          <path d="M8 8h8M8 12h5" />
        </svg>
      ),
    },
    {
      to: "/sell",
      label: "Sell",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      ),
    },
    {
      to: "/profile",
      label: "Profile",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.8-4 4.5-6 8-6s6.2 2 8 6" />
        </svg>
      ),
    },
  ];

  const homePage = (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-copy">
          <p className="eyebrow">BookCycle community marketplace</p>
          <h1>Give finished books a second reader.</h1>
          <p className="hero-text">
            Discover nearby books, save your favorites, chat with owners, and list the titles
            sitting on your shelf in a calmer marketplace built for readers.
          </p>
          <div className="home-actions">
            <Link className="primary-button" to="/marketplace">
              Browse books
            </Link>
            <Link className="secondary-button" to={user ? "/sell" : "/profile"}>
              {user ? "List a book" : "Join BookCycle"}
            </Link>
          </div>
        </div>
        <div className="home-visual">
          <img src={homepageImage} alt="Readers exchanging books through BookCycle" />
        </div>
      </div>

      <div className="home-metrics">
        <div>
          <span>{listingCount}</span>
          <p>Books in the marketplace</p>
        </div>
        <div>
          <span>{user ? wishlistCount : "Local"}</span>
          <p>{user ? "Saved books" : "Reader-to-reader exchange"}</p>
        </div>
        <div>
          <span>{user ? offerCount : "Easy"}</span>
          <p>{user ? "Offers connected to you" : "Buy, rent, or swap flow"}</p>
        </div>
      </div>

      <div className="home-sections">
        <article>
          <h2>Find books nearby</h2>
          <p>Filter by title, author, city, condition, listing type, and price.</p>
        </article>
        <article>
          <h2>Talk before you trade</h2>
          <p>Open a seller conversation from any listing and keep messages in one place.</p>
        </article>
        <article>
          <h2>Manage your exchange</h2>
          <p>Track sent and received offers, wishlist books, and publish your own listings.</p>
        </article>
      </div>
    </section>
  );

  const authPanel = (
    <section className="panel auth-panel">
      <div className="panel-heading">
        <p className="eyebrow">Authentication</p>
        <h2>{user ? "Your profile" : "Create an account or sign in"}</h2>
      </div>

      {!user ? (
        <>
          <div className="segmented-toggle">
            <button
              type="button"
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
            >
              Register
            </button>
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
          </div>

          {authMode === "register" ? (
            <form className="form-grid" onSubmit={handleRegister} noValidate>
              <Field error={registerErrors.name}>
                <input name="name" placeholder="Full name" value={registerForm.name} onChange={updateRegisterField} aria-invalid={Boolean(registerErrors.name)} />
              </Field>
              <Field error={registerErrors.email}>
                <input name="email" type="email" placeholder="Email" value={registerForm.email} onChange={updateRegisterField} aria-invalid={Boolean(registerErrors.email)} />
              </Field>
              <Field error={registerErrors.password}>
                <input name="password" type="password" placeholder="Password" value={registerForm.password} onChange={updateRegisterField} aria-invalid={Boolean(registerErrors.password)} />
              </Field>
              <Field error={registerErrors.city}>
                <input name="city" placeholder="City" value={registerForm.city} onChange={updateRegisterField} aria-invalid={Boolean(registerErrors.city)} />
              </Field>
              <Field error={registerErrors.state}>
                <input name="state" placeholder="State" value={registerForm.state} onChange={updateRegisterField} aria-invalid={Boolean(registerErrors.state)} />
              </Field>
              <button type="submit" className="primary-button" disabled={authLoading}>
                {authLoading ? "Creating account..." : "Create account"}
              </button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={handleLogin} noValidate>
              <Field error={loginErrors.email}>
                <input name="email" type="email" placeholder="Email" value={loginForm.email} onChange={updateLoginField} aria-invalid={Boolean(loginErrors.email)} />
              </Field>
              <Field error={loginErrors.password}>
                <input name="password" type="password" placeholder="Password" value={loginForm.password} onChange={updateLoginField} aria-invalid={Boolean(loginErrors.password)} />
              </Field>
              <button type="submit" className="primary-button" disabled={authLoading}>
                {authLoading ? "Signing in..." : "Login"}
              </button>
            </form>
          )}
        </>
      ) : (
        <div className="profile-card">
          <h3>{formatName(user.name)}</h3>
          <p>{user.email}</p>
          <div className="profile-meta">
            <span>{user.city || "City not set"}</span>
            <span>{user.state || "State not set"}</span>
            <span>{user._count?.listings || 0} listings</span>
            <span>{wishlist.length} saved books</span>
          </div>
        </div>
      )}
    </section>
  );

  const profilePage = user ? (
    <section className="panel profile-page standalone-panel">
      <div className="panel-heading">
        <p className="eyebrow">Profile</p>
        <h2>Your BookCycle account</h2>
      </div>
        <div className="profile-layout">
          <div className="profile-card profile-main-card">
            <div className="profile-avatar" aria-hidden="true">
              {getInitial(user.name, "B")}
            </div>
            <div>
              <h3>{formatName(user.name)}</h3>
              <p>{user.email}</p>
              <p>{user.city || "City not set"}, {user.state || "State not set"}</p>
            </div>
          </div>
          <div className="profile-stat-grid">
            <div>
              <span>{user._count?.listings || 0}</span>
              <p>Published listings</p>
            </div>
            <div>
              <span>{wishlist.length}</span>
              <p>Wishlist books</p>
            </div>
            <div>
              <span>{sentOffers.length}</span>
              <p>Sent offers</p>
            </div>
            <div>
              <span>{receivedOffers.length}</span>
              <p>Received offers</p>
            </div>
          </div>
          <div className="profile-shortcuts">
            <Link className="primary-button" to="/sell">Publish a listing</Link>
            <Link className="secondary-button" to="/offers">Review offers</Link>
            <Link className="secondary-button" to="/messages">Open inbox</Link>
          </div>
          <button type="button" className="ghost-button profile-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
    </section>
  ) : (
    authPanel
  );

  const marketplacePage = (
    <div className="page-grid marketplace-grid">
      <section className="marketplace-intro">
        <div className="marketplace-intro-copy">
          <p className="eyebrow">Marketplace</p>
          <h1>Browse the local shelf before it leaves someone else's desk.</h1>
          <p>
            Use the feed to compare price, condition, location, and exchange type. Select a book
            to inspect the seller, photos, views, offers, and wishlist activity in detail.
          </p>
          <div className="marketplace-highlights">
            <span>{listings.length} live matches</span>
            <span>{activeFilterTags.length || "No"} active filters</span>
            <span>{user ? `${wishlist.length} saved` : "Sign in to save"}</span>
          </div>
        </div>
        <img src={marketplaceImage} alt="Illustrated marketplace shelf with book listing cards" />
      </section>

      <section className="panel listings-panel">
        <div className="panel-heading">
          <p className="eyebrow">Marketplace feed</p>
          <h2>Discover the latest books</h2>
        </div>

        <div className="filter-toolbar">
          <div className="filter-row search-row">
            <input name="search" placeholder="Search by title, author, or ISBN" value={filters.search} onChange={updateFilterField} />
            <input name="city" placeholder="City" value={filters.city} onChange={updateFilterField} />
          </div>
          <div className="filter-row">
            <select name="genre" value={filters.genre} onChange={updateFilterField}>
              <option value="">All genres</option>
              {genreOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <select name="condition" value={filters.condition} onChange={updateFilterField}>
              <option value="">Any condition</option>
              {conditionOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <select name="listingType" value={filters.listingType} onChange={updateFilterField}>
              <option value="">All listing types</option>
              {listingTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="price-row">
            <input name="minPrice" type="number" min="0" step="0.01" placeholder="Min price" value={filters.minPrice} onChange={updateFilterField} />
            <input name="maxPrice" type="number" min="0" step="0.01" placeholder="Max price" value={filters.maxPrice} onChange={updateFilterField} />
          </div>
          <div className="filter-actions">
            <select name="sort" value={filters.sort} onChange={updateFilterField}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="button" className="secondary-button" onClick={clearFilters}>
              Reset filters
            </button>
          </div>
        </div>

        <div className="results-bar">
          <span>{browseLoading ? "Refreshing listings..." : `${listings.length} listing(s) found`}</span>
          {activeFilterTags.length ? (
            <span className="active-filters">
              Active filters:
              {activeFilterTags.map((tag) => (
                <small key={tag}>{tag}</small>
              ))}
            </span>
          ) : (
            <span>Search, sort, and filter listings instantly to find your next read.</span>
          )}
        </div>

        <div className="listing-grid">
          {listings.map((listing) => (
            <button
              key={listing.id}
              type="button"
              className={`listing-card${selectedListingId === listing.id ? " selected" : ""}`}
              onClick={() => openListingDetail(listing.id)}
            >
              <div className="listing-banner">
                <span>{listing.listingType.replaceAll("_", " ")}</span>
                <strong>{listing.condition.replaceAll("_", " ")}</strong>
              </div>
              <div className="listing-preview">
                {listing.images?.[0] ? (
                  <img src={resolveImageUrl(listing.images[0])} alt={listing.title} />
                ) : (
                  <div className="listing-preview-placeholder">No preview available</div>
                )}
                {listing.images?.length > 1 ? (
                  <span className="listing-image-count">{listing.images.length} images</span>
                ) : null}
              </div>
              <h3>{listing.title}</h3>
              <div className="listing-badges">
                <span className="listing-badge author-badge">{listing.author}</span>
                {listing.genre ? (
                  <span className="listing-badge genre-badge">{listing.genre.replaceAll("_", " ")}</span>
                ) : null}
              </div>
              <p className="listing-meta">{listing.city}, {listing.state}</p>
              <div className="listing-footer">
                <strong>{listing.price ? `Rs ${listing.price}` : "Swap / negotiable"}</strong>
                <div className="listing-actions">
                  <span>{formatName(listing.seller?.name)}</span>
                  {user && user.id !== listing.seller?.id ? (
                    <button
                      type="button"
                      className={`wishlist-button${isWishlisted(listing.id) ? " active" : ""}`}
                      onClick={(event) => handleToggleWishlist(listing.id, event)}
                      disabled={wishlistLoadingId === listing.id}
                    >
                      {wishlistLoadingId === listing.id
                        ? "Saving..."
                        : isWishlisted(listing.id)
                          ? "Saved"
                          : "Save"}
                    </button>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
          {!browseLoading && listings.length === 0 ? (
            <div className="empty-state">
              <p>Try a broader search or reset the filters to see more books.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel detail-panel">
        <div className="panel-heading">
          <p className="eyebrow">Listing detail</p>
          <h2>Detailed book view</h2>
        </div>

        {detailLoading ? (
          <div className="empty-state">
            <p>Loading full listing details...</p>
          </div>
        ) : visibleSelectedListing ? (
          <div className="detail-card">
            <div className="detail-topline">
              <span>{visibleSelectedListing.listingType.replaceAll("_", " ")}</span>
              <span>{visibleSelectedListing.condition.replaceAll("_", " ")}</span>
              <span>{visibleSelectedListing.isAvailable ? "Available" : "Not available"}</span>
            </div>
            {visibleSelectedListing.images?.length ? (
              <div className="detail-gallery">
                <img src={resolveImageUrl(visibleSelectedListing.images[0])} alt={visibleSelectedListing.title} />
                {visibleSelectedListing.images.length > 1 ? (
                  <div className="detail-gallery-footer">
                    {visibleSelectedListing.images.length} photos available
                  </div>
                ) : null}
              </div>
            ) : null}
            <h3>{visibleSelectedListing.title}</h3>
            <p className="detail-author">by {visibleSelectedListing.author}</p>
            <p className="detail-price">
              {visibleSelectedListing.price
                ? `Rs ${visibleSelectedListing.price}`
                : visibleSelectedListing.rentPerDay
                  ? `Rs ${visibleSelectedListing.rentPerDay}/day`
                  : "Swap or negotiable"}
            </p>
            <p className="detail-copy">
              {visibleSelectedListing.description || "No description added yet. Contact the seller to learn more about this book."}
            </p>
            <div className="detail-metrics">
              <div>
                <dt>Location</dt>
                <dd>{visibleSelectedListing.city}, {visibleSelectedListing.state}</dd>
              </div>
              <div>
                <dt>Views</dt>
                <dd>{visibleSelectedListing.views}</dd>
              </div>
              <div>
                <dt>Offers</dt>
                <dd>{visibleSelectedListing._count?.offers || 0}</dd>
              </div>
              <div>
                <dt>Wishlists</dt>
                <dd>{visibleSelectedListing._count?.wishlisted || 0}</dd>
              </div>
            </div>
            <div className="seller-box">
              <p className="eyebrow">Seller</p>
              <h4>{formatName(visibleSelectedListing.seller.name)}</h4>
              <p>{visibleSelectedListing.seller.city}, {visibleSelectedListing.seller.state}</p>
              <div className="profile-meta">
                <span>{visibleSelectedListing.seller._count?.listings || 0} listings</span>
                <span>{visibleSelectedListing.seller._count?.reviewsAbout || 0} reviews</span>
              </div>
            </div>
            {user && user.id !== visibleSelectedListing.seller.id ? (
              <div className="detail-actions">
                <button
                  type="button"
                  className={`primary-button wishlist-hero-button${isWishlisted(visibleSelectedListing.id) ? " saved" : ""}`}
                  onClick={(event) => handleToggleWishlist(visibleSelectedListing.id, event)}
                  disabled={wishlistLoadingId === visibleSelectedListing.id}
                >
                  {wishlistLoadingId === visibleSelectedListing.id
                    ? "Updating wishlist..."
                    : isWishlisted(visibleSelectedListing.id)
                      ? "Remove from wishlist"
                      : "Save this book"}
                </button>
                <button type="button" className="secondary-button" onClick={handleOpenSellerConversation}>
                  Message seller
                </button>
              </div>
            ) : null}
            {canMakeOffer ? (
              <form className="offer-form" onSubmit={handleOfferSubmit} noValidate>
                <div className="panel-heading compact">
                  <p className="eyebrow">Make offer</p>
                  <h2>Send a buy, rent, or swap request</h2>
                </div>
                <Field error={offerErrors.type}>
                  <select name="type" value={offerForm.type} onChange={updateOfferField} aria-invalid={Boolean(offerErrors.type)}>
                    {offerTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                {offerForm.type === "BUY" ? (
                  <Field error={offerErrors.price}>
                    <input name="price" type="number" min="0" step="0.01" placeholder="Offer price" value={offerForm.price} onChange={updateOfferField} aria-invalid={Boolean(offerErrors.price)} />
                  </Field>
                ) : null}
                {offerForm.type === "RENT" ? (
                  <Field error={offerErrors.rentDays}>
                    <input name="rentDays" type="number" min="1" placeholder="Rent days" value={offerForm.rentDays} onChange={updateOfferField} aria-invalid={Boolean(offerErrors.rentDays)} />
                  </Field>
                ) : null}
                {offerForm.type === "SWAP" ? (
                  <Field error={offerErrors.swapBookTitle}>
                    <input name="swapBookTitle" placeholder="Book you want to swap" value={offerForm.swapBookTitle} onChange={updateOfferField} aria-invalid={Boolean(offerErrors.swapBookTitle)} />
                  </Field>
                ) : null}
                <Field error={offerErrors.message}>
                  <textarea name="message" rows="3" placeholder="Add a message" value={offerForm.message} onChange={updateOfferField} aria-invalid={Boolean(offerErrors.message)} />
                </Field>
                <button type="submit" className="primary-button" disabled={offerLoading}>
                  {offerLoading ? "Sending offer..." : "Send offer"}
                </button>
              </form>
            ) : null}
          </div>
        ) : (
          <div className="empty-state">
            <p>Select a listing from the marketplace feed to load its full details.</p>
          </div>
        )}
      </section>

      <section className="panel wishlist-panel">
        <div className="panel-heading">
          <p className="eyebrow">Wishlist</p>
          <h2>Saved books for later</h2>
        </div>
        {user ? (
          wishlist.length ? (
            <div className="wishlist-grid">
              {wishlist.map((listing) => (
                <button key={listing.id} type="button" className="wishlist-item" onClick={() => openListingDetail(listing.id)}>
                  <div>
                    <strong>{listing.title}</strong>
                    <p>{listing.author}</p>
                  </div>
                  <span>{listing.price ? `Rs ${listing.price}` : "Swap"}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Save books from the feed or detail view and they will appear here.</p>
            </div>
          )
        ) : (
          <div className="empty-state">
            <p>Login to start saving books to your wishlist.</p>
          </div>
        )}
      </section>
    </div>
  );

  const offersPage = (
    <div className="offers-page">
      <section className="offers-intro">
        <div className="offers-intro-copy">
          <p className="eyebrow">Offer center</p>
          <h1>Track every buy, rent, and swap request in one place.</h1>
          <p>
            Review offers you have sent, respond to readers interested in your listings,
            and keep the book exchange moving without losing the thread.
          </p>
          <div className="offer-summary">
            <span>{sentOffers.length} sent</span>
            <span>{receivedOffers.length} received</span>
            <span>{pendingReceivedCount} need response</span>
            <span>{acceptedOfferCount} accepted</span>
          </div>
        </div>
        <img src={offersImage} alt="Illustrated offer cards for book exchange requests" />
      </section>

      <section className="panel offers-panel standalone-panel">
        <div className="panel-heading">
          <p className="eyebrow">Offer activity</p>
          <h2>Sent and received offers</h2>
        </div>
        {user ? (
          <div className="offer-columns">
            <div className="offer-column">
              <div className="offer-column-heading">
                <h3>Sent offers</h3>
                <p>Requests you made on books from other readers.</p>
              </div>
              {sentOffers.length ? (
                <div className="offer-list">
                  {sentOffers.map((offer) => renderOfferCard(offer, "sent"))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>You have not sent any offers yet. Open a marketplace listing to make your first request.</p>
                </div>
              )}
            </div>
            <div className="offer-column">
              <div className="offer-column-heading">
                <h3>Received offers</h3>
                <p>Reader requests waiting on books you listed.</p>
              </div>
              {receivedOffers.length ? (
                <div className="offer-list">
                  {receivedOffers.map((offer) => renderOfferCard(offer, "received"))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No offers have arrived yet. Fresh photos and clear pricing help readers decide faster.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Login from the profile page to send offers or manage incoming requests.</p>
          </div>
        )}
      </section>
    </div>
  );

  const messagesPage = (
    <div className="messages-page">
      <section className="messages-intro">
        <div className="messages-intro-copy">
          <p className="eyebrow">Reader inbox</p>
          <h1>Keep every book conversation easy to follow.</h1>
          <p>
            Message sellers, answer buyer questions, and keep pickup or swap details beside
            the books that started the conversation.
          </p>
          <div className="message-summary">
            <span>{conversations.length} conversations</span>
            <span>{unreadCount} unread</span>
            <span>{selectedConversation ? `Chatting with ${formatName(selectedConversation.partner.name)}` : "No chat selected"}</span>
          </div>
        </div>
        <img src={messagesImage} alt="Illustrated reader inbox with chat bubbles and books" />
      </section>

      <section className="panel messages-panel standalone-panel">
        <div className="panel-heading">
          <p className="eyebrow">Messages</p>
          <h2>Inbox and conversation view</h2>
        </div>
        {user ? (
          <div className="message-layout">
            <aside className="conversation-list">
              <div className="conversation-list-heading">
                <h3>Conversations</h3>
                <span>{unreadCount} unread</span>
              </div>
              {conversations.length ? (
                conversations.map((conversation) => {
                  const lastMessageMine = conversation.lastMessage.senderId === user.id;
                  return (
                    <button
                      key={conversation.partner.id}
                      type="button"
                      className={`conversation-item${selectedConversationUserId === conversation.partner.id ? " active" : ""}`}
                      onClick={() => setSelectedConversationUserId(conversation.partner.id)}
                    >
                      <span className="conversation-avatar" aria-hidden="true">
                        {getInitial(conversation.partner.name)}
                      </span>
                      <span className="conversation-copy">
                        <strong>{formatName(conversation.partner.name)}</strong>
                        <small>{lastMessageMine ? "You: " : ""}{conversation.lastMessage.content}</small>
                      </span>
                      <span className={`conversation-count${conversation.unreadCount ? " unread" : ""}`}>
                        {conversation.unreadCount ? conversation.unreadCount : "Seen"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="empty-state">
                  <p>No conversations yet. Use "Message seller" from a listing to start one.</p>
                </div>
              )}
            </aside>
            <div className="chat-panel">
              {selectedConversationUserId ? (
                <>
                  <div className="chat-header">
                    <div className="conversation-avatar large" aria-hidden="true">
                      {getInitial(selectedConversation?.partner.name)}
                    </div>
                    <div>
                      <p className="eyebrow">Active chat</p>
                      <h3>{formatName(selectedConversation?.partner.name)}</h3>
                    </div>
                  </div>
                  <div className="chat-thread">
                    {conversationLoading ? (
                      <div className="empty-state">
                        <p>Loading conversation...</p>
                      </div>
                    ) : messages.length ? (
                      messages.map((message) => {
                        const mine = message.senderId === user.id;
                        return (
                          <div key={message.id} className={`chat-message-row${mine ? " mine" : ""}`}>
                            {!mine ? (
                              <span className="message-avatar" aria-hidden="true">
                                {getInitial(message.sender.name)}
                              </span>
                            ) : null}
                            <div className={`chat-bubble${mine ? " mine" : ""}`}>
                              <strong>{mine ? "You" : formatName(message.sender.name)}</strong>
                              <p>{message.content}</p>
                            </div>
                            {mine ? (
                              <span className="message-avatar mine" aria-hidden="true">
                                Y
                              </span>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-state">
                        <p>No messages in this conversation yet. Send a quick note to get started.</p>
                      </div>
                    )}
                  </div>
                  <form className="chat-form" onSubmit={handleSendMessage} noValidate>
                    <Field error={messageErrors.content}>
                      <textarea name="content" rows="3" placeholder="Type your message" value={messageForm.content} onChange={updateMessageField} aria-invalid={Boolean(messageErrors.content)} />
                    </Field>
                    <button type="submit" className="primary-button" disabled={messageLoading}>
                      {messageLoading ? "Sending..." : "Send message"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="empty-state">
                  <p>Select a conversation or open one from a listing detail page.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Login from the profile page to use the in-app chat and inbox.</p>
          </div>
        )}
      </section>
    </div>
  );

  const sellPage = (
    <div className="sell-page">
      <section className="sell-intro">
        <div className="sell-intro-copy">
          <p className="eyebrow">Share your shelf</p>
          <h1>Turn an idle book into someone else's next read.</h1>
          <p>
            Add the basics, choose a genre, upload a few photos, and publish it for local
            readers who want to buy, rent, or swap.
          </p>
          <div className="sell-steps">
            <span>1. Book details</span>
            <span>2. Price or swap type</span>
            <span>3. Photos and location</span>
          </div>
        </div>
        <img src={sellImage} alt="Illustrated book listing form with publishing details" />
      </section>

      <section className="panel create-panel standalone-panel">
        <div className="panel-heading">
          <p className="eyebrow">New listing</p>
          <h2>Publish a book for nearby readers</h2>
        </div>
        {user ? (
          <form className="form-grid listing-form" onSubmit={handleCreateListing} noValidate>
            <Field error={listingErrors.title}>
              <input name="title" placeholder="Book title" value={listingForm.title} onChange={updateListingField} aria-invalid={Boolean(listingErrors.title)} />
            </Field>
            <Field error={listingErrors.author}>
              <input name="author" placeholder="Author" value={listingForm.author} onChange={updateListingField} aria-invalid={Boolean(listingErrors.author)} />
            </Field>
            <Field error={listingErrors.genre}>
              <select name="genre" value={listingForm.genre} onChange={updateListingField} aria-invalid={Boolean(listingErrors.genre)}>
                <option value="">Choose genre</option>
                {genreOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field error={listingErrors.condition}>
              <select name="condition" value={listingForm.condition} onChange={updateListingField} aria-invalid={Boolean(listingErrors.condition)}>
                {conditionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field error={listingErrors.listingType}>
              <select name="listingType" value={listingForm.listingType} onChange={updateListingField} aria-invalid={Boolean(listingErrors.listingType)}>
                {listingTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field error={listingErrors.price}>
              <input name="price" type="number" min="0" step="0.01" placeholder="Price" value={listingForm.price} onChange={updateListingField} aria-invalid={Boolean(listingErrors.price)} />
            </Field>
            <Field error={listingErrors.city}>
              <input name="city" placeholder="City" value={listingForm.city} onChange={updateListingField} aria-invalid={Boolean(listingErrors.city)} />
            </Field>
            <Field error={listingErrors.state}>
              <input name="state" placeholder="State" value={listingForm.state} onChange={updateListingField} aria-invalid={Boolean(listingErrors.state)} />
            </Field>
            <Field error={listingErrors.description} className="wide-field">
              <textarea name="description" placeholder="Condition notes, edition, highlights, pickup preference..." rows="4" value={listingForm.description} onChange={updateListingField} aria-invalid={Boolean(listingErrors.description)} />
            </Field>
            <Field error={listingErrors.images} className="wide-field">
              <label className="file-input-label">
                <span>Upload up to 5 images</span>
                <input
                  type="file"
                  name="images"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleListingImagesChange}
                />
              </label>
            </Field>
            {listingForm.images?.length ? (
              <div className="listing-files">
                <span>{listingForm.images.length} photo(s) selected</span>
                <ul>
                  {listingForm.images.map((file) => (
                    <li key={file.name + file.size}>{file.name}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button type="submit" className="primary-button" disabled={listingLoading}>
              {listingLoading ? "Publishing..." : "Publish listing"}
            </button>
          </form>
        ) : (
          <div className="empty-state">
            <p>Sign in from the profile page to publish your book listing and share it with the community.</p>
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <Link className="nav-brand" to="/">BookCycle</Link>
        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-chip${isActive ? " active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.to === "/messages" && unreadCount ? (
                <span className="nav-badge">{unreadCount}</span>
              ) : null}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="status-strip">
        <span>{user ? `Signed in as ${formatName(user.name)}` : "Guest browsing"}</span>
        <strong>{status}</strong>
      </div>

      {error ? <div className="feedback error">{error}</div> : null}

      <main className="app-layout">
        <section className="page-view">
          <Routes>
            <Route path="/" element={homePage} />
            <Route path="/marketplace" element={marketplacePage} />
            <Route path="/offers" element={offersPage} />
            <Route path="/messages" element={messagesPage} />
            <Route path="/sell" element={sellPage} />
            <Route path="/profile" element={profilePage} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

export default App;
