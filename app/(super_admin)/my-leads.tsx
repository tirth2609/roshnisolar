import MyLeadsPage from '../my-leads';
type Props = React.ComponentProps<typeof MyLeadsPage>;
export default function SuperAdminMyLeadsWrapper(props: Props) {
  return <MyLeadsPage {...props} routerBase="/(super_admin)" />;
} 