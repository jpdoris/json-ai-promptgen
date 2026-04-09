<script setup lang="ts">
import { reactive } from 'vue'
import { useFormPayload, type FieldMeta } from '@/composables/useFormPayload'

interface AddressForm {
  street: string
  city: string
  zip: string
}

interface PreferencesForm {
  subscribed: boolean
  contactMethod: string
}

interface UserForm {
  firstName: string
  lastName: string
  email: string
  address: AddressForm
  preferences: PreferencesForm
}

const form = reactive<UserForm>({
  firstName: '',
  lastName: '',
  email: '',
  address: {
    street: '',
    city: '',
    zip: '',
  },
  preferences: {
    subscribed: false,
    contactMethod: 'email',
  },
})

const fieldMeta = {
  firstName: {
    label: 'First Name',
    description: 'The user’s given name.',
  },
  lastName: {
    label: 'Last Name',
    description: 'The user’s family name.',
  },
  email: {
    label: 'Email Address',
    description: 'The primary email used for contact.',
  },
  'address.street': {
    label: 'Street',
    description: 'The street line of the mailing address.',
  },
  'address.city': {
    label: 'City',
    description: 'The city portion of the mailing address.',
  },
  'address.zip': {
    label: 'ZIP Code',
    description: 'The postal code for the mailing address.',
  },
  'preferences.subscribed': {
    label: 'Subscribed',
    description: 'Whether the user wants to receive updates.',
  },
  'preferences.contactMethod': {
    label: 'Preferred Contact Method',
    description: 'The user’s preferred method of communication.',
  },
} satisfies Record<string, FieldMeta>

const { buildPayload } = useFormPayload(form, fieldMeta)

const handleSubmit = () => {
  const payload = buildPayload()
  console.log(JSON.stringify(payload, null, 2))
}
</script>
