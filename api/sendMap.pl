#!/usr/bin/perl -w
use CGI;
use Data::Dumper;

open STDERR, ">>errors" if $ENV{SERVER_SOFTWARE} =~ m/^mini_httpd/;

my $q = CGI->new;
my $data = $q->param('POSTDATA');
if(!defined($data)) { $data = $q->param('XForms:Model'); }
print $q->header('text/plain');
print "Looks like you sent: $data\n";
warn "Content type of request is ".$q->content_type();
warn Dumper($q);
warn "Data sent by application: $data\n";
