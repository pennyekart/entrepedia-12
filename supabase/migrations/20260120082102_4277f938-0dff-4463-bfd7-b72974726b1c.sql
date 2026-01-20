-- Drop existing overly permissive policies on conversations
DROP POLICY IF EXISTS "Anyone can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can delete conversations" ON public.conversations;

-- Drop existing overly permissive policies on messages
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.messages;

-- Create secure RLS policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (
  auth.uid() = participant_one OR auth.uid() = participant_two
);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_one OR auth.uid() = participant_two
);

CREATE POLICY "Participants can update their conversations"
ON public.conversations FOR UPDATE
USING (
  auth.uid() = participant_one OR auth.uid() = participant_two
);

CREATE POLICY "Participants can delete their conversations"
ON public.conversations FOR DELETE
USING (
  auth.uid() = participant_one OR auth.uid() = participant_two
);

-- Create secure RLS policies for messages
CREATE POLICY "Conversation participants can view messages"
ON public.messages FOR SELECT
USING (
  is_conversation_participant(conversation_id)
);

CREATE POLICY "Conversation participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND is_conversation_participant(conversation_id)
);

CREATE POLICY "Senders can update their messages"
ON public.messages FOR UPDATE
USING (
  auth.uid() = sender_id
);

CREATE POLICY "Senders can delete their messages"
ON public.messages FOR DELETE
USING (
  auth.uid() = sender_id
);