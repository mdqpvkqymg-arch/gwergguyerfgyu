import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Star, Users } from "lucide-react";
import ContactCard from "./ContactCard";

interface Contact {
  id: string;
  name: string;
  avatarColor: string;
  isOnline: boolean;
}

interface HomeScreenProps {
  contacts: Contact[];
  currentUserId: string;
  onStartConversation: (contactId: string) => void;
}

const IMPORTANT_CONTACTS_KEY = "scalk_important_contacts";

const HomeScreen = ({
  contacts,
  currentUserId,
  onStartConversation,
}: HomeScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [importantIds, setImportantIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(IMPORTANT_CONTACTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => c.id !== currentUserId)
      .filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [contacts, currentUserId, searchQuery]);

  const importantContacts = useMemo(() => {
    return filteredContacts
      .filter((c) => importantIds.includes(c.id))
      .slice(0, 9);
  }, [filteredContacts, importantIds]);

  const otherContacts = useMemo(() => {
    return filteredContacts.filter((c) => !importantIds.includes(c.id));
  }, [filteredContacts, importantIds]);

  const toggleImportant = (contactId: string) => {
    setImportantIds((prev) => {
      const newIds = prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId];
      localStorage.setItem(IMPORTANT_CONTACTS_KEY, JSON.stringify(newIds));
      return newIds;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="pl-12 h-12 text-lg rounded-full bg-card border-border focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Important Contacts Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <h2 className="text-lg font-semibold text-foreground">
              Important Contacts
            </h2>
            <span className="text-sm text-muted-foreground">
              ({importantContacts.length}/9)
            </span>
          </div>

          {importantContacts.length === 0 ? (
            <div className="bg-card/50 border border-dashed border-border rounded-2xl p-8 text-center">
              <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No important contacts yet
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Hover over a contact and click the star to add them
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-3">
              {importantContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  id={contact.id}
                  name={contact.name}
                  avatarColor={contact.avatarColor}
                  isOnline={contact.isOnline}
                  isImportant={true}
                  onToggleImportant={() => toggleImportant(contact.id)}
                  onClick={() => onStartConversation(contact.id)}
                  compact
                />
              ))}
            </div>
          )}
        </section>

        {/* All Contacts Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              All Contacts
            </h2>
            <span className="text-sm text-muted-foreground">
              ({otherContacts.length})
            </span>
          </div>

          {otherContacts.length === 0 ? (
            <div className="bg-card/50 border border-dashed border-border rounded-2xl p-8 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No contacts found matching your search"
                  : "No other contacts available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  id={contact.id}
                  name={contact.name}
                  avatarColor={contact.avatarColor}
                  isOnline={contact.isOnline}
                  isImportant={false}
                  onToggleImportant={() => toggleImportant(contact.id)}
                  onClick={() => onStartConversation(contact.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomeScreen;
