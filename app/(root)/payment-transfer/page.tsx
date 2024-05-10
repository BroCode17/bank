import HeaderBox from '@/components/HeaderBox'
import PaymentTransferForm from '@/components/PaymentTransferForm'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const Transfer = async() => {
  const loggedIn = await getLoggedInUser()
  //get banks and update the homepage
  const accounts = await getAccounts({userId: loggedIn.$id})
  if(!accounts) return;

  const accountData = accounts?.data
  return (
    <section className='payment-transfer'>
        <HeaderBox title="Payment Transfer" subtext="Please provide any specific details or notes related to the payment transfer" />
        <section className="">
        <PaymentTransferForm accounts={accountData} />
        </section>

    </section>
  )
}

export default Transfer
